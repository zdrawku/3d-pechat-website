const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { buildSitemap, readBlogPosts, MAIN_PAGE_LASTMOD } = require('./generate-sitemap');
const { parseSitemap } = require('./indexnow');

const ROOT = path.join(__dirname, '..');
const locales = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/locales.json'), 'utf8'));
const posts = readBlogPosts(fs.readFileSync(path.join(ROOT, 'src/app/services/blog-posts.registry.ts'), 'utf8'));
const xml = buildSitemap({ locales, posts });
const SITE = 'https://3dpechat.bg';

/** The <url> block whose <loc> is `loc`. */
const entry = (loc) => [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]).find((b) => b.includes(`<loc>${loc}</loc>`));
const hreflangs = (block) => [...block.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\/>/g)].map((m) => `${m[1]} ${m[2]}`);

test('lists every localized page once per language', () => {
  const locs = parseSitemap(xml).map((u) => u.loc);
  for (const page of locales.localizedPages) {
    for (const { code } of locales.locales) {
      const loc = `${SITE}${code === locales.defaultLocale ? '' : `/${code}`}${page}`;
      assert.ok(locs.includes(loc), `missing ${loc}`);
    }
  }
  assert.equal(new Set(locs).size, locs.length, 'no duplicate <loc>');
});

test('pairs each language version with every other one, x-default = Bulgarian', () => {
  for (const loc of [`${SITE}/prices/`, `${SITE}/en/prices/`]) {
    assert.deepEqual(hreflangs(entry(loc)), [
      `bg ${SITE}/prices/`,
      `en ${SITE}/en/prices/`,
      `x-default ${SITE}/prices/`
    ], loc);
  }
  assert.deepEqual(hreflangs(entry(`${SITE}/en/`)), [`bg ${SITE}/`, `en ${SITE}/en/`, `x-default ${SITE}/`]);
});

test('pairs the blog index with its translations', () => {
  assert.deepEqual(hreflangs(entry(`${SITE}/en/blog/`)), [`bg ${SITE}/blog/`, `en ${SITE}/en/blog/`, `x-default ${SITE}/blog/`]);
});

test('lists every post; a translated one pairs with its translations, a Bulgarian-only one with nothing', () => {
  const english = locales.translatedPosts.en;
  for (const post of posts) {
    const loc = `${SITE}${post.route.replace(/\/+$/, '')}/`;
    const block = entry(loc);
    assert.ok(block, post.route);
    const translated = english[post.slug];
    const expected = translated ? [`bg ${loc}`, `en ${SITE}/en/blog/${translated}/`, `x-default ${loc}`] : [];
    assert.deepEqual(hreflangs(block), expected, post.route);
    if (translated) {
      assert.deepEqual(hreflangs(entry(`${SITE}/en/blog/${translated}/`)), expected, translated);
    }
  }
});

test('gives a translated post the lastmod of its translation, not of the original', () => {
  const lastmod = Object.fromEntries(parseSitemap(xml).map((u) => [u.loc, u.lastmod.slice(0, 10)]));
  const copy = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/en/content/blog.json'), 'utf8'));
  for (const [source, slug] of Object.entries(locales.translatedPosts.en)) {
    assert.equal(lastmod[`${SITE}/en/blog/${slug}/`], copy[source].dateModified, slug);
  }
});

test('refuses a translated post without a dateModified', () => {
  assert.throws(() => buildSitemap({ locales, posts, translations: { en: {} } }), /en\/content\/blog\.json has no dateModified for "/);
});

/** { <loc>: 'YYYY-MM-DD' } of a sitemap. */
const lastmods = (sitemap) => Object.fromEntries(parseSitemap(sitemap).map((u) => [u.loc, u.lastmod.slice(0, 10)]));

test('uses the hand-maintained lastmod of each URL, never the build date', () => {
  const lastmod = lastmods(buildSitemap({ locales, posts, products: [] }));
  for (const [page, date] of Object.entries(MAIN_PAGE_LASTMOD)) {
    assert.equal(lastmod[`${SITE}${page}`], date, page);
  }
});

test('moves the products page in every language forward to the newest product, and nothing else', () => {
  const lastmod = lastmods(buildSitemap({ locales, posts, products: [{ dateAdded: '2099-01-02' }, { dateAdded: '2099-01-01' }, {}] }));
  for (const [page, date] of Object.entries(MAIN_PAGE_LASTMOD)) {
    const expected = page === '/products/' || page === '/en/products/' ? '2099-01-02' : date;
    assert.equal(lastmod[`${SITE}${page}`], expected, page);
  }
});

test('keeps the hand-maintained products date when it is newer than every product', () => {
  const lastmod = lastmods(buildSitemap({ locales, posts, products: [{ dateAdded: '2000-01-01' }] }));
  assert.equal(lastmod[`${SITE}/products/`], MAIN_PAGE_LASTMOD['/products/']);
  assert.equal(lastmod[`${SITE}/en/products/`], MAIN_PAGE_LASTMOD['/en/products/']);
});

test('refuses a localized page without a lastmod entry', () => {
  const { '/en/prices/': _dropped, ...withoutOne } = MAIN_PAGE_LASTMOD;
  assert.throws(() => buildSitemap({ locales, posts, lastmod: withoutOne }), /MAIN_PAGE_LASTMOD has no entry for \/en\/prices\//);
});
