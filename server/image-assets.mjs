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
  '150000': '内蒙古',
  '210000': '辽宁',
  '220000': '吉林',
  '230000': '黑龙江',
  '310000': '上海',
  '320000': '江苏',
  '330000': '浙江',
  '340000': '安徽',
  '350000': '福建',
  '360000': '江西',
  '370000': '山东',
  '410000': '河南',
  '420000': '湖北',
  '430000': '湖南',
  '440000': '广东',
  '450000': '广西',
  '460000': '海南',
  '500000': '重庆',
  '510000': '四川',
  '520000': '贵州',
  '530000': '云南',
  '540000': '西藏',
  '610000': '陕西',
  '620000': '甘肃',
  '630000': '青海',
  '640000': '宁夏',
  '650000': '新疆',
  '710000': '台湾',
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
    'Use case: precise-object-edit',
    'Asset type: source image for contour-clipped interactive Chinese food map block',
    `Edit target: the provided input image is the exact ${asset.title} map contour. It is not a loose style reference; it is the mandatory geometry, canvas, scale, rotation, position, padding, coastline, holes, and island placement.`,
    `Primary request: keep the map silhouette exactly where it is and fill only the green contour interior with ${subject}. Convert the pale green interior into detailed food-and-landscape artwork while preserving the outer border and every small island position.`,
    'Strict geometry rules: do not redraw, simplify, expand, shrink, rotate, recenter, crop, or invent the map outline. Do not add new land shapes. Do not remove small islands. Keep the same 800x600-style canvas framing and the same empty outside area.',
    'Composition/framing: artwork must fill the entire contour interior, including narrow coastal areas and islands. Place large representative dishes in the broad interior and smaller regional details near edges, but never let the generated composition change the silhouette.',
    'Style/medium: high-quality polished guofeng realistic food illustration, dimensional collage, crisp edible details, premium competition demo asset, warm appetizing light.',
    'Background/outside contour: keep everything outside the contour flat, clean, and visually removable. No shadows, textures, scenery, or objects outside the contour.',
    'Constraints: no UI, no buttons, no watermark, no logos, no people, no large readable text.',
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
    quality: process.env.IMAGE_GEN_QUALITY || 'high',
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

function sanitizeAssetPatch(patch = {}) {
  const next = {};
  if (typeof patch.prompt === 'string') next.prompt = patch.prompt;
  if (typeof patch.model === 'string' && patch.model.trim()) next.model = patch.model.trim();
  if (typeof patch.quality === 'string' && patch.quality.trim()) next.quality = patch.quality.trim();
  if (typeof patch.size === 'string' && patch.size.trim()) next.size = patch.size.trim();
  return next;
}

function patchAssetForGeneration(asset, patch = {}) {
  const normalizedPatch = typeof patch === 'string' ? { prompt: patch } : sanitizeAssetPatch(patch);
  if (!Object.keys(normalizedPatch).length) return asset;
  return {
    ...asset,
    ...normalizedPatch,
    promptUpdatedAt: new Date().toISOString(),
  };
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

async function clipAssetOutput(asset) {
  const sourcePath = publicToFilePath(asset.sourceImage);
  const outputPath = publicToFilePath(asset.outputImage);
  const contourPath = publicToFilePath(asset.inputImage);

  if (!(await pathExists(sourcePath))) {
    throw new Error(`AI 源图不存在，无法裁切：${asset.sourceImage}`);
  }

  await execFileAsync('python3', [
    clipScriptPath,
    '--source', sourcePath,
    '--contour', contourPath,
    '--out', outputPath,
  ], { cwd: projectRoot });
}

async function generateAndClipAsset(asset) {
  const sourcePath = publicToFilePath(asset.sourceImage);
  const generatedBytes = await callImageEditApi(asset);
  await mkdir(dirname(sourcePath), { recursive: true });
  await writeFile(sourcePath, generatedBytes);

  await clipAssetOutput(asset);

  return {
    ...asset,
    clippedAt: new Date().toISOString(),
    generatedAt: new Date().toISOString(),
    lastSourceBytes: generatedBytes.length,
  };
}

async function mapWithConcurrency(items, concurrency, iterator) {
  const results = new Array(items.length);
  let cursor = 0;
  const workerCount = Math.max(1, Math.min(concurrency, items.length));

  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await iterator(items[index], index);
    }
  }));

  return results;
}

export async function clipImageAsset(assetId, patch = {}) {
  let asset = await updateImageAsset(assetId, sanitizeAssetPatch(patch));
  await clipAssetOutput(asset);
  asset = await updateImageAsset(assetId, {
    clippedAt: new Date().toISOString(),
  });

  return {
    asset,
    cacheBust: Date.now(),
  };
}

export async function regenerateImageAsset(assetId, patch = {}) {
  const assets = await readImageAssets();
  const index = assets.findIndex((asset) => asset.id === assetId);
  if (index === -1) {
    throw new Error(`Unknown image asset: ${assetId}`);
  }

  const asset = await generateAndClipAsset(patchAssetForGeneration(assets[index], patch));
  assets[index] = asset;
  await writeAssetData(assets);

  return {
    asset,
    cacheBust: Date.now(),
  };
}

export async function regenerateImageAssets(options = {}) {
  const assets = await readImageAssets();
  const assetIds = Array.isArray(options.assetIds) && options.assetIds.length
    ? new Set(options.assetIds.map(String))
    : null;
  const kinds = Array.isArray(options.kinds) && options.kinds.length
    ? new Set(options.kinds.map(String))
    : null;
  const limit = Number(options.limit);
  const concurrency = Math.max(1, Math.min(Number(options.concurrency) || 3, 6));
  const patchById = options.patchById && typeof options.patchById === 'object' ? options.patchById : {};
  const sharedPatch = options.patch && typeof options.patch === 'object' ? options.patch : {};

  let selected = assets
    .map((asset, index) => ({ asset, index }))
    .filter(({ asset }) => (!assetIds || assetIds.has(asset.id)) && (!kinds || kinds.has(asset.kind)));

  if (Number.isFinite(limit) && limit > 0) {
    selected = selected.slice(0, limit);
  }

  const skipped = [];
  const jobs = [];
  for (const item of selected) {
    const outputExists = await pathExists(publicToFilePath(item.asset.outputImage));
    if (options.onlyMissing === true && outputExists) {
      skipped.push({
        id: item.asset.id,
        outputImage: item.asset.outputImage,
        reason: 'output-exists',
      });
    } else {
      jobs.push(item);
    }
  }

  const results = await mapWithConcurrency(jobs, concurrency, async ({ asset, index }) => {
    try {
      const patch = patchById[asset.id] || sharedPatch;
      const nextAsset = await generateAndClipAsset(patchAssetForGeneration(asset, patch));
      assets[index] = nextAsset;
      return {
        asset: nextAsset,
        id: asset.id,
        ok: true,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
        id: asset.id,
        ok: false,
      };
    }
  });

  if (results.some((result) => result.ok)) {
    await writeAssetData(assets);
  }

  return {
    cacheBust: Date.now(),
    concurrency,
    failed: results.filter((result) => !result.ok).length,
    generated: results.filter((result) => result.ok).length,
    requested: selected.length,
    results,
    skipped,
  };
}
