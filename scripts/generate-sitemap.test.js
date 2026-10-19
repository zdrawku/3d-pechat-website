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

test('keeps the blog Bulgarian-only: no hreflang on posts or the blog index', () => {
  assert.deepEqual(hreflangs(entry(`${SITE}/blog/`)), []);
  for (const post of posts) {
    const block = entry(`${SITE}${post.route.replace(/\/+$/, '')}/`);
    assert.ok(block, post.route);
    assert.deepEqual(hreflangs(block), [], post.route);
  }
});

test('uses the hand-maintained lastmod of each URL, never the build date', () => {
  const lastmod = Object.fromEntries(parseSitemap(xml).map((u) => [u.loc, u.lastmod.slice(0, 10)]));
  for (const [page, date] of Object.entries(MAIN_PAGE_LASTMOD)) {
    assert.equal(lastmod[`${SITE}${page}`], date, page);
  }
});

test('refuses a localized page without a lastmod entry', () => {
  const { '/en/prices/': _dropped, ...withoutOne } = MAIN_PAGE_LASTMOD;
  assert.throws(() => buildSitemap({ locales, posts, lastmod: withoutOne }), /MAIN_PAGE_LASTMOD has no entry for \/en\/prices\//);
});
