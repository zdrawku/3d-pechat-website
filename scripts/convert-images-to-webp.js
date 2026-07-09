/**
 * One-off migration: converts all .jpg/.jpeg/.png files under src/assets/real-images
 * to .webp (max width 1920px, quality 80) and deletes the originals.
 *
 * Exceptions (kept in their original format because they are used as og:image URLs,
 * where some social scrapers still don't render WebP):
 *   - real-images/20250517_164324.jpg (re-encoded in place to 1200px-wide JPEG)
 *
 * Usage: node scripts/convert-images-to-webp.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// sharp's file cache keeps input handles open, which breaks unlink on Windows
sharp.cache(false);

const ROOT = path.join(__dirname, '../src/assets/real-images');
const KEEP_AS_JPEG = new Set([
  path.join(ROOT, '20250517_164324.jpg'),
]);

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png']);

// Windows can briefly hold a lock on freshly read files (antivirus/indexer)
async function unlinkWithRetry(file, attempts = 5) {
  for (let i = 0; i < attempts; i++) {
    try {
      fs.unlinkSync(file);
      return;
    } catch (err) {
      if (err.code !== 'EBUSY' && err.code !== 'EPERM') throw err;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  fs.unlinkSync(file);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

(async () => {
  const files = walk(ROOT).filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()));
  let converted = 0;
  let savedBytes = 0;

  for (const file of files) {
    const originalSize = fs.statSync(file).size;

    if (KEEP_AS_JPEG.has(file)) {
      const tmp = file + '.tmp';
      await sharp(file)
        .rotate() // bake in EXIF orientation
        .resize({ width: 1200, withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toFile(tmp);
      fs.renameSync(tmp, file);
      savedBytes += originalSize - fs.statSync(file).size;
      console.log(`~ re-encoded (kept as jpg): ${path.relative(ROOT, file)}`);
      continue;
    }

    const target = file.slice(0, file.length - path.extname(file).length) + '.webp';
    await sharp(file)
      .rotate()
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(target);
    await unlinkWithRetry(file);
    converted++;
    savedBytes += originalSize - fs.statSync(target).size;
    console.log(`✓ ${path.relative(ROOT, file)} -> ${path.basename(target)}`);
  }

  console.log(`\nConverted ${converted} images, saved ${(savedBytes / 1024 / 1024).toFixed(1)} MB`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
