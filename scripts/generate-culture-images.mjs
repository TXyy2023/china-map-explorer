import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CULTURE_THEMES } from '../src/foodMapConfig.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const DEFAULT_API_BASE = 'http://160.202.231.11:8700/v1';
const DEFAULT_MODEL = 'gpt-image-2';
const DEFAULT_SIZE = '1024x640';
const DEFAULT_QUALITY = 'low';
const DEFAULT_CONCURRENCY = 2;
const DEFAULT_MAX_ATTEMPTS = 4;
const DEFAULT_COOLDOWN_MS = 15 * 60 * 1000;
const DEFAULT_WEBP_QUALITY = 82;

function parseArgs(argv) {
  const result = {
    concurrency: DEFAULT_CONCURRENCY,
    cooldownMs: DEFAULT_COOLDOWN_MS,
    force: false,
    kinds: new Set(['map', 'item']),
    limit: Infinity,
    maxAttempts: DEFAULT_MAX_ATTEMPTS,
    quality: process.env.IMAGE_GEN_QUALITY || DEFAULT_QUALITY,
    size: process.env.IMAGE_GEN_SIZE || DEFAULT_SIZE,
    themes: new Set(Object.keys(CULTURE_THEMES)),
    webpQuality: DEFAULT_WEBP_QUALITY,
  };

  argv.forEach((arg) => {
    if (arg === '--force') {
      result.force = true;
      return;
    }
    if (arg === '--dry-run') {
      result.dryRun = true;
      return;
    }
    const [key, value = ''] = arg.split('=');
    if (key === '--theme') {
      result.themes = new Set(value.split(',').map((item) => item.trim()).filter(Boolean));
    } else if (key === '--kind') {
      result.kinds = new Set(value.split(',').map((item) => item.trim()).filter(Boolean));
    } else if (key === '--limit') {
      result.limit = Number.parseInt(value, 10);
    } else if (key === '--concurrency') {
      result.concurrency = Math.max(1, Number.parseInt(value, 10) || DEFAULT_CONCURRENCY);
    } else if (key === '--max-attempts') {
      result.maxAttempts = Math.max(1, Number.parseInt(value, 10) || DEFAULT_MAX_ATTEMPTS);
    } else if (key === '--cooldown-ms') {
      result.cooldownMs = Math.max(0, Number.parseInt(value, 10) || 0);
    } else if (key === '--size') {
      result.size = value || DEFAULT_SIZE;
    } else if (key === '--quality') {
      result.quality = value || DEFAULT_QUALITY;
    } else if (key === '--webp-quality') {
      result.webpQuality = Math.min(100, Math.max(1, Number.parseInt(value, 10) || DEFAULT_WEBP_QUALITY));
    }
  });

  return result;
}

function normalizeApiBase(value) {
  return String(value || DEFAULT_API_BASE).replace(/\/+$/, '');
}

function normalizeModel(value) {
  const raw = String(value || DEFAULT_MODEL).trim();
  if (raw === 'gpt-iamge-2') {
    console.warn('IMAGE_GEN_MODEL=gpt-iamge-2 appears misspelled; using available model gpt-image-2.');
    return DEFAULT_MODEL;
  }
  return raw || DEFAULT_MODEL;
}

function publicAssetToFilePath(src) {
  if (!src?.startsWith('/assets/')) {
    throw new Error(`Only /assets public paths are supported: ${src}`);
  }
  return resolve(projectRoot, 'public', src.slice(1));
}

async function fileExists(path) {
  try {
    const info = await stat(path);
    return info.size > 0;
  } catch {
    return false;
  }
}

function mapPrompt({ theme, area, zoomLevel }) {
  const zoomText = {
    area: 'medium zoom area fill with balanced icon clusters and readable-at-a-glance cultural scenes',
    country: 'far zoom regional map fill with bold silhouettes and high-contrast cultural symbols',
    province: 'close zoom province fill with denser texture, material details, and layered motifs',
  }[zoomLevel] || 'map fill';

  return [
    'Use case: infographic-diagram',
    `Asset type: clipped SVG map-block fill for ${theme.name}`,
    `Primary request: Create a polished AI-generated visual texture for the map block "${area.name}".`,
    `Zoom behavior: ${zoomText}.`,
    `Cultural theme: ${area.description}`,
    'Composition: fill the entire 16:10 frame edge to edge; avoid empty corners; no map outline, no labels, no UI frame.',
    'Visual language: refined Chinese cultural infographic illustration, crisp symbolic objects, layered motifs, subtle depth, bright enough for map inspection.',
    'Constraints: no readable text, no captions, no logos, no watermark, no people portraits, no national flags, no dark blur.',
    'The browser will clip this rectangular image into the exact geographic contour, so keep important motifs near the center and distribute secondary texture across the full frame.',
  ].join('\n');
}

function itemPrompt({ theme, area, item }) {
  const process = (item.process || []).join('；');
  return [
    'Use case: infographic-diagram',
    `Asset type: hotspot thumbnail and right-side detail infographic for ${theme.name}`,
    `Primary request: Create one polished visual explanation card for "${item.name}" in "${area.name}".`,
    `Cultural context: ${area.description}`,
    `Key ideas to visualize as symbolic scenes, not text: ${process}`,
    'Composition: 16:10 educational infographic card, clear central subject, 3-4 small visual panels or icon clusters, high contrast at thumbnail size.',
    'Style: refined Chinese cultural illustration, museum-exhibit polish, accurate cultural atmosphere, crisp details, warm practical lighting.',
    'Constraints: no readable text, no captions, no logos, no watermark, no UI widgets, no people portraits, no fake map labels.',
  ].join('\n');
}

function addJob(jobs, job) {
  if (!job.src) return;
  jobs.push({
    ...job,
    outputPath: publicAssetToFilePath(job.src),
  });
}

function buildJobs(options) {
  const jobs = [];

  Object.entries(CULTURE_THEMES).forEach(([themeId, theme]) => {
    if (!options.themes.has(themeId)) return;

    if (options.kinds.has('map')) {
      addJob(jobs, {
        id: `${themeId}:map:country-overview`,
        prompt: [
          'Use case: infographic-diagram',
          `Asset type: national overview fallback map fill for ${theme.name}`,
          `Primary request: Create a cohesive national cultural-map visual overview for "${theme.name}".`,
          `Cultural scope: ${theme.description}`,
          'Composition: 16:10, edge-to-edge dense cultural atlas texture, no actual labels, no map borders, no empty corners.',
          'Constraints: no readable text, no logos, no watermark, no people portraits, no dark blur.',
        ].join('\n'),
        src: theme.chinaAsset?.src,
      });

      theme.areas.forEach((area) => {
        ['country', 'area', 'province'].forEach((zoomLevel) => {
          addJob(jobs, {
            id: `${themeId}:map:${area.id}:${zoomLevel}`,
            prompt: mapPrompt({ area, theme, zoomLevel }),
            src: area.mapFills?.[zoomLevel],
          });
        });
      });
    }

    if (options.kinds.has('item')) {
      theme.areas.forEach((area) => {
        (area.foodItems || []).forEach((item) => {
          addJob(jobs, {
            id: `${themeId}:item:${item.id}`,
            prompt: itemPrompt({ area, item, theme }),
            src: item.detailImage || item.image,
          });
        });
      });
    }
  });

  const seen = new Set();
  return jobs
    .filter((job) => {
      if (seen.has(job.src)) return false;
      seen.add(job.src);
      return true;
    })
    .slice(0, Number.isFinite(options.limit) ? options.limit : undefined);
}

function isRetryableStatus(status) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function sleep(ms) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

async function readErrorPayload(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

async function fetchGeneratedImage({ apiBase, apiKey, model, options, prompt }) {
  const response = await fetch(`${apiBase}/images/generations`, {
    body: JSON.stringify({
      model,
      n: 1,
      output_format: 'png',
      prompt,
      quality: options.quality,
      size: options.size,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    const payload = await readErrorPayload(response);
    const message = payload.error?.message || payload.error || `${response.status} ${response.statusText}`;
    const error = new Error(message);
    error.retryable = isRetryableStatus(response.status);
    error.status = response.status;
    throw error;
  }

  const payload = await response.json();
  const image = payload.data?.[0];
  if (image?.b64_json) {
    return Buffer.from(image.b64_json, 'base64');
  }
  if (image?.url) {
    const imageResponse = await fetch(image.url);
    if (!imageResponse.ok) {
      const error = new Error(`Image URL download failed: ${imageResponse.status}`);
      error.retryable = isRetryableStatus(imageResponse.status);
      throw error;
    }
    return Buffer.from(await imageResponse.arrayBuffer());
  }
  throw new Error('Image API response did not include b64_json or url.');
}

async function optimizeForOutput(imageBytes, outputPath, options) {
  if (extname(outputPath).toLowerCase() !== '.webp') {
    return imageBytes;
  }

  const { default: sharp } = await import('sharp');
  return sharp(imageBytes)
    .resize(1024, 640, {
      fit: 'cover',
      position: 'attention',
      withoutEnlargement: true,
    })
    .webp({
      effort: 5,
      quality: options.webpQuality,
      smartSubsample: true,
    })
    .toBuffer();
}

async function generateWithRetries(job, config, options) {
  let lastError = null;
  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    try {
      return await fetchGeneratedImage({
        apiBase: config.apiBase,
        apiKey: config.apiKey,
        model: config.model,
        options,
        prompt: job.prompt,
      });
    } catch (error) {
      lastError = error;
      const retryable = error.retryable !== false;
      if (!retryable || attempt === options.maxAttempts) break;
      const waitMs = Math.min(60_000, 1500 * 2 ** (attempt - 1));
      console.warn(`[${job.id}] attempt ${attempt}/${options.maxAttempts} failed: ${error.message}; retrying in ${Math.round(waitMs / 1000)}s`);
      await sleep(waitMs);
    }
  }

  if (options.cooldownMs > 0 && lastError?.retryable !== false) {
    console.warn(`[${job.id}] failed after ${options.maxAttempts} attempts; waiting ${Math.round(options.cooldownMs / 60000)} minutes before one more retry window.`);
    await sleep(options.cooldownMs);
    return generateWithRetries(job, config, { ...options, cooldownMs: 0 });
  }

  throw lastError || new Error('Unknown image generation failure.');
}

async function runJob(job, config, options) {
  if (options.dryRun) {
    console.log(`[dry-run] ${job.id} -> ${job.src}`);
    return { dryRun: true };
  }

  if (!options.force && await fileExists(job.outputPath)) {
    console.log(`[skip] ${job.id} -> ${job.src}`);
    return { skipped: true };
  }

  await mkdir(dirname(job.outputPath), { recursive: true });
  const imageBytes = await generateWithRetries(job, config, options);
  const optimizedBytes = await optimizeForOutput(imageBytes, job.outputPath, options);
  await writeFile(job.outputPath, optimizedBytes);
  const written = await readFile(job.outputPath);
  console.log(`[write] ${job.id} -> ${job.src} (${written.length} bytes)`);
  return { written: true };
}

async function runQueue(jobs, config, options) {
  let cursor = 0;
  const summary = { dryRun: 0, failed: 0, skipped: 0, written: 0 };

  async function worker(workerIndex) {
    while (cursor < jobs.length) {
      const job = jobs[cursor];
      cursor += 1;
      try {
        console.log(`[worker ${workerIndex}] ${job.id}`);
        const result = await runJob(job, config, options);
        if (result.dryRun) summary.dryRun += 1;
        if (result.skipped) summary.skipped += 1;
        if (result.written) summary.written += 1;
      } catch (error) {
        summary.failed += 1;
        console.error(`[fail] ${job.id}: ${error.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: options.concurrency }, (_, index) => worker(index + 1)));
  return summary;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const apiKey = process.env.OPENAI_API_KEY;
  const config = {
    apiBase: normalizeApiBase(process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE),
    apiKey,
    model: normalizeModel(process.env.IMAGE_GEN_MODEL),
  };
  const jobs = buildJobs(options);

  console.log(`Prepared ${jobs.length} image jobs.`);
  console.log(`API base: ${config.apiBase}`);
  console.log(`Model: ${config.model}`);
  console.log(`Size: ${options.size}; quality: ${options.quality}; concurrency: ${options.concurrency}`);

  if (!options.dryRun && !apiKey) {
    throw new Error('OPENAI_API_KEY is required for image generation.');
  }

  const summary = await runQueue(jobs, config, options);
  console.log(`Done. written=${summary.written} skipped=${summary.skipped} dryRun=${summary.dryRun} failed=${summary.failed}`);
  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
