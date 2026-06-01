import { execFile } from 'node:child_process';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { DEFAULT_FOOD_THEME } from '../src/foodMapConfig.js';

const execFileAsync = promisify(execFile);

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = resolve(projectRoot, 'public');
const assetDataPath = resolve(projectRoot, 'server/data/food-image-assets.json');
const clipScriptPath = resolve(projectRoot, 'scripts/clip_food_assets.py');

const provinceNames = {
  '110000': '北京',
  '120000': '天津',
  '130000': '河北',
  '140000': '山西',
  '310000': '上海',
  '320000': '江苏',
  '330000': '浙江',
  '340000': '安徽',
  '370000': '山东',
  '410000': '河南',
  '440000': '广东',
  '450000': '广西',
  '460000': '海南',
  '500000': '重庆',
  '510000': '四川',
  '520000': '贵州',
  '610000': '陕西',
  '620000': '甘肃',
  '630000': '青海',
  '640000': '宁夏',
  '650000': '新疆',
  '810000': '香港',
  '820000': '澳门',
};

function stripQuery(path) {
  return String(path || '').split('?')[0];
}

function publicToFilePath(publicPath) {
  const clean = stripQuery(publicPath).replace(/^\/+/, '');
  return resolve(publicRoot, clean);
}

function sourcePathFor(publicPath) {
  const clean = stripQuery(publicPath);
  const stem = basename(clean, extname(clean));
  return `/assets/food/generated-sources/${stem}-source.png`;
}

function promptForAsset(asset) {
  const subject = asset.kind === 'province'
    ? `${asset.title}，${provinceNames[asset.provinceAdcode] || asset.provinceAdcode}地方美食与地貌`
    : `${asset.title}，${asset.name || asset.title}地域美食总览`;

  return [
    'Use case: style-transfer',
    'Asset type: contour-clipped Chinese food map artwork',
    `Input images: the input image is the exact ${asset.title} contour reference. Use it as the mandatory silhouette and composition guide.`,
    `Primary request: fill the inside of the provided contour with ${subject}. Food and regional scenery should slightly extend beyond the contour edge so exact mask clipping has no pale gaps.`,
    'Style/medium: polished guofeng realistic food illustration, dimensional collage, premium web asset, dark green hand-drawn contour edge.',
    'Composition/framing: keep the silhouette centered; put large representative dishes in the center and smaller landscape/details near the edges; avoid empty interior areas.',
    'Lighting/mood: warm studio food lighting, refined, appetizing, competition-ready.',
    'Constraints: preserve the input contour shape, no UI, no buttons, no watermark, no logos, no people, no large readable text.',
  ].join('\n');
}

function buildDefaultAssets() {
  const theme = DEFAULT_FOOD_THEME;
  const assets = [
    {
      id: 'country:china',
      inputImage: '/assets/food/china_contour.png',
      kind: 'country',
      name: theme.name,
      outputImage: stripQuery(theme.chinaAsset.src),
      sourceImage: sourcePathFor(theme.chinaAsset.src),
      title: '全国美食大盘',
    },
  ];

  theme.areas.forEach((area) => {
    assets.push({
      areaId: area.id,
      id: `area:${area.id}`,
      inputImage: `/assets/food/${area.id}_contour.png`,
      kind: 'area',
      name: area.name,
      outputImage: stripQuery(area.summaryAsset.src),
      sourceImage: sourcePathFor(area.summaryAsset.src),
      title: area.summaryAsset.title,
    });

    area.assets.forEach((asset) => {
      assets.push({
        areaId: area.id,
        id: `province:${asset.provinceAdcode}`,
        inputImage: `/assets/food/${asset.provinceAdcode}_contour.png`,
        kind: 'province',
        name: area.name,
        outputImage: stripQuery(asset.src),
        provinceAdcode: String(asset.provinceAdcode),
        sourceImage: sourcePathFor(asset.src),
        title: asset.title,
      });
    });
  });

  return assets.map((asset) => ({
    ...asset,
    model: process.env.IMAGE_GEN_MODEL || 'gpt-image-2',
    prompt: promptForAsset(asset),
    quality: process.env.IMAGE_GEN_QUALITY || 'medium',
    size: process.env.IMAGE_GEN_SIZE || 'auto',
  }));
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return fallback;
  }
}

async function writeAssetData(assets) {
  await mkdir(dirname(assetDataPath), { recursive: true });
  await writeFile(assetDataPath, JSON.stringify({ assets }, null, 2));
}

export async function readImageAssets() {
  const defaults = buildDefaultAssets();
  const saved = await readJson(assetDataPath, { assets: [] });
  const savedById = new Map((saved.assets || []).map((asset) => [asset.id, asset]));
  const merged = defaults.map((asset) => ({
    ...asset,
    ...(savedById.get(asset.id) || {}),
    inputImage: asset.inputImage,
    kind: asset.kind,
    outputImage: asset.outputImage,
    sourceImage: asset.sourceImage,
  }));

  if (!(await pathExists(assetDataPath))) {
    await writeAssetData(merged);
  }

  return merged;
}

export async function updateImageAsset(assetId, patch) {
  const assets = await readImageAssets();
  const index = assets.findIndex((asset) => asset.id === assetId);
  if (index === -1) {
    throw new Error(`Unknown image asset: ${assetId}`);
  }
  assets[index] = {
    ...assets[index],
    ...patch,
    promptUpdatedAt: new Date().toISOString(),
  };
  await writeAssetData(assets);
  return assets[index];
}

function getImageApiBaseUrl() {
  return (process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE || 'https://api.openai.com/v1').replace(/\/+$/, '');
}

async function callImageEditApi(asset) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY 未设置，无法调用图片生成 API');
  }

  const inputPath = publicToFilePath(asset.inputImage);
  const bytes = await readFile(inputPath);
  const form = new FormData();
  form.append('model', asset.model || process.env.IMAGE_GEN_MODEL || 'gpt-image-2');
  form.append('prompt', asset.prompt);
  form.append('n', '1');
  form.append('size', asset.size || process.env.IMAGE_GEN_SIZE || 'auto');
  form.append('quality', asset.quality || process.env.IMAGE_GEN_QUALITY || 'medium');
  form.append('output_format', 'png');
  form.append('image', new Blob([bytes], { type: 'image/png' }), basename(inputPath));

  const response = await fetch(`${getImageApiBaseUrl()}/images/edits`, {
    body: form,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    method: 'POST',
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || payload.error || `图片生成 API 调用失败：${response.status}`);
  }

  const imageBase64 = payload.data?.[0]?.b64_json;
  if (!imageBase64) {
    throw new Error('图片生成 API 未返回 b64_json 图片数据');
  }
  return Buffer.from(imageBase64, 'base64');
}

export async function regenerateImageAsset(assetId, prompt) {
  let asset = await updateImageAsset(assetId, prompt ? { prompt } : {});
  const sourcePath = publicToFilePath(asset.sourceImage);
  const outputPath = publicToFilePath(asset.outputImage);
  const contourPath = publicToFilePath(asset.inputImage);

  const generatedBytes = await callImageEditApi(asset);
  await mkdir(dirname(sourcePath), { recursive: true });
  await writeFile(sourcePath, generatedBytes);

  await execFileAsync('python3', [
    clipScriptPath,
    '--source', sourcePath,
    '--contour', contourPath,
    '--out', outputPath,
  ], { cwd: projectRoot });

  asset = await updateImageAsset(assetId, {
    generatedAt: new Date().toISOString(),
    lastSourceBytes: generatedBytes.length,
  });

  return {
    asset,
    cacheBust: Date.now(),
  };
}
