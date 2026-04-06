import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svgPath = join(root, 'public', 'icon.svg');
const input = readFileSync(svgPath);

const targets = [
  { file: 'favicon-32.png', size: 32 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'pwa-192.png', size: 192 },
  { file: 'pwa-512.png', size: 512 },
];

async function main() {
  for (const { file, size } of targets) {
    const out = join(root, 'public', file);
    await sharp(input, { density: 300 })
      .resize(size, size, { fit: 'fill' })
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log('wrote', file, size + '×' + size);
  }
  console.log('Готово. Иконки обновлены из public/icon.svg');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
