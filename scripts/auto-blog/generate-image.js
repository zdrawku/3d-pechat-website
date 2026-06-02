// Generates a cover image for a blog post using Pollinations.ai (free, no API key).
// Saves it as src/assets/blogs/images/{slug}-cover.png (1200x630 — OG-friendly).

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const IMAGES_DIR = path.join(ROOT, 'src/assets/blogs/images');

const WIDTH = 1200;
const HEIGHT = 630;

async function generateCoverImage(slug, imagePrompt) {
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const outPath = path.join(IMAGES_DIR, `${slug}-cover.png`);

  // Build an English prompt that's safe and photorealistic.
  const safePrompt = `${imagePrompt}, 3D printing technology, professional photography, dramatic lighting, high detail, no text, no watermark`;
  const encoded = encodeURIComponent(safePrompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=${WIDTH}&height=${HEIGHT}&nologo=true&model=flux`;

  console.log(`[generate-image] fetching from Pollinations.ai…`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outPath, buf);
    const relPath = path.relative(ROOT, outPath).replace(/\\/g, '/');
    console.log(`[generate-image] saved → ${relPath}`);
    return relPath; // e.g. "src/assets/blogs/images/my-slug-cover.png"
  } finally {
    clearTimeout(timer);
  }
}

// Returns the asset-relative path used in imageUrl / HTML: assets/blogs/images/{slug}-cover.png
function assetPath(slug) {
  return `assets/blogs/images/${slug}-cover.png`;
}

module.exports = { generateCoverImage, assetPath };
