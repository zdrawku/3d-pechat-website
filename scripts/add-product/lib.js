/**
 * Shared helpers for adding a product to `src/data/products.json`.
 *
 * Used by both add-product entry points:
 *   - the `/add-product` Claude Code skill (`.claude/skills/add-product/`), and
 *   - the GitHub Issue form flow (`scripts/add-product/from-issue.js`).
 *
 * Everything here is deliberately dependency-light (only `sharp`, already a
 * devDependency) and side-effect free until you call a `write*` function.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// sharp's file cache keeps input handles open, which breaks unlink on Windows
sharp.cache(false);

const REPO_ROOT = path.resolve(__dirname, '../..');
const PRODUCTS_JSON = path.join(REPO_ROOT, 'src/data/products.json');
const IMAGES_DIR = path.join(REPO_ROOT, 'src/assets/real-images');

/**
 * Bulgarian → Latin transliteration for slug generation, following the official
 * streamlined system (Наредба за транслитерацията). `ъ` → `a`, `ь` dropped,
 * digraphs (ж→zh, ч→ch, ш→sh, щ→sht, ю→yu, я→ya) spelled out.
 */
const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
  р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch',
  ш: 'sh', щ: 'sht', ъ: 'a', ь: '', ю: 'yu', я: 'ya',
};

/**
 * Turns a Bulgarian (or Latin) product name into a stable kebab-case slug.
 *
 * ⚠️ The slug becomes the product's `linkId`, which is its DOM id and the
 * target of shared `#deep-links` — changing it later breaks existing links.
 */
function slugify(name) {
  return String(name)
    .toLowerCase()
    .split('')
    .map((ch) => (Object.prototype.hasOwnProperty.call(TRANSLIT, ch) ? TRANSLIT[ch] : ch))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

/** Reads and parses products.json. */
function readProducts() {
  return JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf8'));
}

/** Next free product id (ids have historical gaps — never renumber, just extend). */
function nextId(products) {
  return products.reduce((max, p) => Math.max(max, p.id), 0) + 1;
}

/** Makes `slug` unique against the existing linkIds by appending -2, -3, … */
function uniqueLinkId(products, slug) {
  const taken = new Set(products.map((p) => p.linkId));
  if (!taken.has(slug)) return slug;
  let n = 2;
  while (taken.has(`${slug}-${n}`)) n++;
  return `${slug}-${n}`;
}

/** Today's date as `YYYY-MM-DD` (local time — the maker's "today"). */
function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Converts one image to `.webp` under `src/assets/real-images/`, matching the
 * conventions of `scripts/convert-images-to-webp.js` (EXIF rotation baked in,
 * max 1920px wide, quality 80).
 *
 * @param {string|Buffer} source Path to a source image, or its bytes.
 * @param {string} baseName Target filename without extension (e.g. a slug).
 * @param {string} [subDir] Optional folder under real-images/.
 * @returns {string} The site-absolute path to store in products.json.
 */
async function convertImage(source, baseName, subDir = '') {
  const outDir = subDir ? path.join(IMAGES_DIR, subDir) : IMAGES_DIR;
  fs.mkdirSync(outDir, { recursive: true });

  const fileName = `${baseName}.webp`;
  const outPath = path.join(outDir, fileName);

  await sharp(source)
    .rotate() // bake in EXIF orientation
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outPath);

  const rel = path.relative(IMAGES_DIR, outPath).split(path.sep).join('/');
  return `/assets/real-images/${rel}`;
}

/**
 * Builds a well-formed product entry. Callers supply the *content* (Bulgarian
 * name/description/tags, already reviewed by a human); this fills in the
 * mechanical fields (id, linkId, dateAdded) and drops empty ones.
 */
function buildProduct(products, input) {
  const {
    name,
    description,
    frontImage,
    backImage,
    tags = [],
    hasOldCoins = false,
    hasEuroCoins = false,
    hasImagePadding,
    featured,
    pageUrl,
    customContent,
    links,
    linkId,
  } = input;

  if (!name || !description) {
    throw new Error('add-product: `name` and `description` are required.');
  }

  const entry = {
    id: nextId(products),
    linkId: uniqueLinkId(products, linkId ? slugify(linkId) : slugify(name)),
    name,
    description,
  };

  if (frontImage) entry.frontImage = frontImage;
  if (backImage) entry.backImage = backImage;
  entry.dateAdded = today();
  entry.hasOldCoins = Boolean(hasOldCoins);
  entry.hasEuroCoins = Boolean(hasEuroCoins);
  if (hasImagePadding !== undefined) entry.hasImagePadding = Boolean(hasImagePadding);
  if (featured) entry.featured = true;
  if (pageUrl) entry.pageUrl = pageUrl;
  if (customContent) entry.customContent = customContent;
  if (tags.length) entry.tags = tags;
  if (links && links.length) entry.links = links;

  return entry;
}

/**
 * Appends an entry to products.json **without reformatting the rest of the
 * file**: the existing entries keep their hand-tuned layout (inline `tags`
 * arrays, CRLF line endings) so the diff shows only the new product.
 */
function appendProduct(entry) {
  const raw = fs.readFileSync(PRODUCTS_JSON, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';

  // Serialize with the file's 2-space indent, then keep `tags` on one line the
  // way every existing entry does.
  const block = JSON.stringify(entry, null, 2)
    .replace(/"tags": \[[^\]]*\]/s, (m) => m.replace(/\s+/g, ' ').replace(/\[ /, '[').replace(/ \]/, ']'))
    .split('\n')
    .map((line) => '  ' + line) // nest one level inside the top-level array
    .join(eol);

  // Insert before the final `]`, adding a comma after the previous last entry.
  const closeIdx = raw.lastIndexOf(']');
  const head = raw.slice(0, closeIdx).replace(/\s+$/, '');
  const updated = `${head},${eol}${block}${eol}]${eol}`;

  fs.writeFileSync(PRODUCTS_JSON, updated, 'utf8');
  return entry;
}

module.exports = {
  REPO_ROOT,
  PRODUCTS_JSON,
  IMAGES_DIR,
  slugify,
  readProducts,
  nextId,
  uniqueLinkId,
  today,
  convertImage,
  buildProduct,
  appendProduct,
};
