import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import sharp from 'sharp';

const SOURCE_DIR = 'public/assets/generated-culture';
const DEFAULT_WEBP_QUALITY = 82;

function parseArgs(argv) {
  return {
    deleteSource: argv.includes('--delete-source'),
    quality: Number.parseInt(argv.find((arg) => arg.startsWith('--quality='))?.split('=')[1], 10) || DEFAULT_WEBP_QUALITY,
  };
}

async function listPngFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listPngFiles(path));
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.png') {
      files.push(path);
    }
  }

  return files;
}

async function optimizeOne(path, options) {
  const outputPath = path.replace(/\.png$/i, '.webp');
  await mkdir(dirname(outputPath), { recursive: true });
  await sharp(path)
    .resize(1024, 640, {
      fit: 'cover',
      position: 'attention',
      withoutEnlargement: true,
    })
    .webp({
      effort: 5,
      quality: Math.min(100, Math.max(1, options.quality)),
      smartSubsample: true,
    })
    .toFile(outputPath);

  const [sourceInfo, outputInfo] = await Promise.all([stat(path), stat(outputPath)]);
  console.log(`[webp] ${path} -> ${outputPath} (${sourceInfo.size} -> ${outputInfo.size} bytes)`);

  if (options.deleteSource) {
    await rm(path);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const files = await listPngFiles(SOURCE_DIR);
  console.log(`Found ${files.length} PNG files.`);

  for (const file of files) {
    await optimizeOne(file, options);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
