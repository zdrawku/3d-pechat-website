// Files a blog post: its markdown and its entry in blog-posts.registry.ts, and
// for a translation its markdown, its copy (src/i18n/<lang>/content/blog.json)
// and its slug (`translatedPosts` in src/i18n/locales.json). Nothing else is
// needed — every post is served by one route and one component
// (src/app/blog/article/), so no Angular file or route is generated.

const fs = require('fs');
const path = require('path');
const { wrapFaqSection } = require('./faq-markers');
const { toJsonFile } = require('./json-format');

const ROOT = path.resolve(__dirname, '../..');
const ASSETS_DIR = path.join(ROOT, 'src/assets/blogs');
const REGISTRY_FILE = path.join(ROOT, 'src/app/services/blog-posts.registry.ts');
const LOCALES_FILE = path.join(ROOT, 'src/i18n/locales.json');
const copyFile = (locale) => path.join(ROOT, `src/i18n/${locale}/content/blog.json`);

/** The registry's marker comment: new entries go right before it. */
const REGISTRY_MARKER = '// Add more blog posts here';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

function escapeForSingleQuotes(str) {
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/** True when the registry already has a post with this slug. */
function registryHasSlug(registrySource, slug) {
  return new RegExp(`slug:\\s*'${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`).test(registrySource);
}

function ensureUniqueSlug(slug, registrySource = fs.readFileSync(REGISTRY_FILE, 'utf8')) {
  let candidate = slug;
  let i = 2;
  while (fs.existsSync(path.join(ASSETS_DIR, `${candidate}.md`)) || registryHasSlug(registrySource, candidate)) {
    candidate = `${slug}-${i++}`;
  }
  return candidate;
}

/** Writes a post's markdown (FAQ section marked) and returns its path. */
function writeMarkdown(file, markdown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, wrapFaqSection(markdown.replace(/\r\n/g, '\n')).trimEnd() + '\n', 'utf8');
  return file;
}

/**
 * Registry source with a new entry before the marker comment (or before the
 * array's closing `];`), and the entry's id — one more than the highest.
 */
function insertRegistryEntry(src, { slug, seo, imageUrl }) {
  const ids = [...src.matchAll(/id:\s*'(\d+)'/g)].map((m) => parseInt(m[1], 10));
  const id = String((ids.length ? Math.max(...ids) : 0) + 1);
  const literal = (list) => `[${list.map((t) => `'${escapeForSingleQuotes(t)}'`).join(', ')}]`;
  const keywords = String(seo.keywords || '').split(',').map((k) => k.trim()).filter(Boolean);
  const entry = `  {
    id: '${id}',
    title: '${escapeForSingleQuotes(seo.title)}',
    description: '${escapeForSingleQuotes(seo.description)}',
    slug: '${slug}',
    route: '/blog/${slug}',
    date: new Date('${seo.publishDate}'),
    imageUrl: '${imageUrl}',
    tags: ${literal(seo.tags || [])},
    author: '3D Печат България',
    keywords: ${literal(keywords)},
    dateModified: new Date('${seo.publishDate}')
  }`;
  // The previous entry already ends with a comma when the marker follows it.
  const updated = src.includes(REGISTRY_MARKER)
    ? src.replace(/(})(,?)(\s*\n\s*\/\/ Add more blog posts here)/, `$1,\n${entry},$3`)
    : src.replace(/(\n\s*)\];/, `,\n${entry}$1];`);
  if (updated === src) throw new Error('Could not insert the entry into blog-posts.registry.ts');
  return { source: updated, id };
}

/** A Bulgarian post: markdown + registry entry. */
function scaffoldPost(article, coverImagePath) {
  const registry = fs.readFileSync(REGISTRY_FILE, 'utf8');
  const slug = ensureUniqueSlug(article.slug, registry);
  if (slug !== article.slug) {
    console.warn(`[scaffold] slug collision; using '${slug}' instead of '${article.slug}'`);
  }
  const { assetPath } = require('./generate-image');
  const imageUrl = coverImagePath ? assetPath(slug) : 'assets/og-image.png';
  const markdownFile = writeMarkdown(path.join(ASSETS_DIR, `${slug}.md`), article.markdown);
  const { source, id } = insertRegistryEntry(registry, { slug, seo: article.seo, imageUrl });
  fs.writeFileSync(REGISTRY_FILE, source, 'utf8');
  return { slug, id, markdownFile: path.relative(ROOT, markdownFile) };
}

/**
 * locales.json and blog.json data with a translation added: its slug under
 * `translatedPosts[locale]`, its copy under the Bulgarian slug. Throws when the
 * post is already translated or the slug is taken (a published slug must
 * never change — CLAUDE.md Rule 5.5).
 */
function addTranslation(locales, copies, { locale, source, slug, copy }) {
  const posts = locales.translatedPosts?.[locale] ?? {};
  if (posts[source]) throw new Error(`"${source}" is already translated into ${locale} (${posts[source]})`);
  if (Object.values(posts).includes(slug)) throw new Error(`the ${locale} slug "${slug}" is already used`);
  return {
    locales: { ...locales, translatedPosts: { ...locales.translatedPosts, [locale]: { ...posts, [source]: slug } } },
    copies: { ...copies, [source]: copy }
  };
}

/** A translation: its markdown, copy and slug, written to the repo. */
function scaffoldTranslation({ locale = 'en', source, slug, copy, markdown }) {
  const file = copyFile(locale);
  const { locales, copies } = addTranslation(readJson(LOCALES_FILE), fs.existsSync(file) ? readJson(file) : {}, { locale, source, slug, copy });
  const markdownFile = writeMarkdown(path.join(ASSETS_DIR, locale, `${slug}.md`), markdown);
  fs.writeFileSync(LOCALES_FILE, toJsonFile(locales), 'utf8');
  fs.writeFileSync(file, toJsonFile(copies), 'utf8');
  return { locale, source, slug, markdownFile: path.relative(ROOT, markdownFile) };
}

/** A registry entry's copy, read back by slug (for translating an existing post). */
function readRegistryEntry(slug, src = fs.readFileSync(REGISTRY_FILE, 'utf8')) {
  const block = [...src.matchAll(/\{\s*id:\s*'[^']*'[\s\S]*?\}/g)].map((m) => m[0]).find((b) => new RegExp(`slug:\\s*'${slug}'`).test(b));
  if (!block) return null;
  const str = (key) => ((block.match(new RegExp(`\\b${key}:\\s*'((?:[^'\\\\]|\\\\.)*)'`)) || [])[1] || '').replace(/\\'/g, "'");
  const list = (key) => [...((block.match(new RegExp(`\\b${key}:\\s*\\[([^\\]]*)\\]`)) || [])[1] || '').matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\'/g, "'"));
  return { slug, title: str('title'), description: str('description'), tags: list('tags'), keywords: list('keywords') };
}

module.exports = {
  REGISTRY_MARKER,
  scaffoldPost,
  scaffoldTranslation,
  insertRegistryEntry,
  addTranslation,
  ensureUniqueSlug,
  readRegistryEntry
};
