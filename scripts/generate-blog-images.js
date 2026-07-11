/**
 * Converts blog cover images under src/assets/blogs/images to optimized WebP.
 *
 * Covers are rendered small (card thumbnails ~400px wide, hero ~800px on retina),
 * so we cap width at 800px and encode WebP q80. The originals were huge PNG/JPG
 * (e.g. 3d-printirani-obuvki-cover-3.png was ~600 KB at 1613px wide). After
 * conversion the originals are deleted and references in blog.service.ts are
 * rewritten to the .webp path.
 *
 * Idempotent: files already converted are skipped. Safe to run in prebuild.
 *
 * Usage: node scripts/generate-blog-images.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// sharp's file cache keeps input handles open, which breaks unlink on Windows
sharp.cache(false);

const IMAGES_DIR = path.join(__dirname, '../src/assets/blogs/images');
const BLOG_SERVICE = path.join(__dirname, '../src/app/services/blog.service.ts');
const BLOGS_DIR = path.join(__dirname, '../src/assets/blogs');

const MAX_WIDTH = 800;
const QUALITY = 80;
const SOURCE_EXTS = new Set(['.jpg', '.jpeg', '.png']);

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

(async () => {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.warn(`⚠ Directory not found: ${IMAGES_DIR}`);
    return;
  }

  const files = fs
    .readdirSync(IMAGES_DIR)
    .filter((f) => SOURCE_EXTS.has(path.extname(f).toLowerCase()));

  let serviceContent = fs.readFileSync(BLOG_SERVICE, 'utf8');
  const mdFiles = fs.existsSync(BLOGS_DIR)
    ? fs
        .readdirSync(BLOGS_DIR)
        .filter((f) => f.endsWith('.md'))
        .map((f) => path.join(BLOGS_DIR, f))
    : [];
  const mdContents = mdFiles.map((filePath) => ({
    path: filePath,
    content: fs.readFileSync(filePath, 'utf8'),
  }));
  let converted = 0;
  let savedBytes = 0;

  for (const name of files) {
    const src = path.join(IMAGES_DIR, name);
    const webpName = name.slice(0, name.length - path.extname(name).length) + '.webp';
    const target = path.join(IMAGES_DIR, webpName);

    const originalSize = fs.statSync(src).size;

    await sharp(src)
      .rotate() // bake in EXIF orientation
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(target);

    await unlinkWithRetry(src);

    // Rewrite any reference to the original file in blog.service.ts
    serviceContent = serviceContent.split(name).join(webpName);

    // Rewrite references in blog markdown files
    for (const md of mdContents) {
      md.content = md.content.split(name).join(webpName);
    }

    converted++;
    savedBytes += originalSize - fs.statSync(target).size;
    console.log(`✓ ${name} -> ${webpName} (${(originalSize / 1024).toFixed(0)} KB -> ${(fs.statSync(target).size / 1024).toFixed(0)} KB)`);
  }

  if (converted > 0) {
    fs.writeFileSync(BLOG_SERVICE, serviceContent);
    console.log(`\n✓ Updated blog.service.ts references`);

    for (const md of mdContents) {
      fs.writeFileSync(md.path, md.content);
    }
    console.log(`✓ Updated references in ${mdContents.length} markdown files`);
  }

  console.log(`\nConverted ${converted} blog images, saved ${(savedBytes / 1024 / 1024).toFixed(1)} MB`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
