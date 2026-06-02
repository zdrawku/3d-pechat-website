// Generates a cover image for a blog post using Pollinations.ai (free, no API key).
// Saves it as src/assets/blogs/images/{slug}-cover.{jpg|png} (1200x630 — OG-friendly).

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const IMAGES_DIR = path.join(ROOT, 'src/assets/blogs/images');

const WIDTH = 1024;
const HEIGHT = 1024;

const CONTENT_TYPE_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

async function generateCoverImage(slug, imagePrompt) {
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

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

    // Detect actual format from response headers to avoid extension mismatches.
    const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const ext = CONTENT_TYPE_TO_EXT[contentType] || 'jpg';
    if (ext !== 'png') {
      console.warn(`[generate-image] warning: Pollinations returned ${contentType || 'unknown'}, saving as .${ext}`);
    }

    const outPath = path.join(IMAGES_DIR, `${slug}-cover.${ext}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outPath, buf);
    const relPath = path.relative(ROOT, outPath).replace(/\\/g, '/');
    console.log(`[generate-image] saved → ${relPath}`);
    return relPath; // e.g. "src/assets/blogs/images/my-slug-cover.jpg"
  } finally {
    clearTimeout(timer);
  }
}

// Returns the asset-relative path used in imageUrl / HTML: assets/blogs/images/{slug}-cover.{ext}
// Checks which extension actually exists on disk; falls back to .jpg.
function assetPath(slug) {
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
    const abs = path.join(IMAGES_DIR, `${slug}-cover.${ext}`);
    if (fs.existsSync(abs)) return `assets/blogs/images/${slug}-cover.${ext}`;
  }
  return `assets/blogs/images/${slug}-cover.jpg`;
}

module.exports = { generateCoverImage, assetPath };
