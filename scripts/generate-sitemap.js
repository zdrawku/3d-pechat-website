const fs = require('fs');
const path = require('path');

// Reads the blog registry (blog-posts.registry.ts) to list the blog posts, and
// src/i18n/locales.json for the languages and the pages that exist in each.
const registryPath = path.join(__dirname, '../src/app/services/blog-posts.registry.ts');
const localesPath = path.join(__dirname, '../src/i18n/locales.json');
const sitemapPath = path.join(__dirname, '../src/sitemap.xml');

const SITE = 'https://3dpechat.bg';

// <lastmod> for every main page in every language, maintained BY HAND: bump the
// date when a page's content or template meaningfully changes (a translation
// edit bumps only that language's URL). Do not derive these from git or from
// "today": the deploy checkout is shallow (every file would report the deploy
// date) and a lastmod that changes on every build teaches Google to ignore the
// field. Blog posts get theirs from `dateModified` in the registry.
const MAIN_PAGE_LASTMOD = {
  '/': '2026-10-18',          // hreflang → the English home page /en/, language switcher
  '/portfolio/': '2026-10-18', // hreflang → /en/portfolio/, language switcher
  '/products/': '2026-10-18',  // hreflang → /en/products/, language switcher
  '/prices/': '2026-10-18',    // hreflang → /en/prices/, language switcher
  '/contact/': '2026-10-18',   // hreflang → /en/contact/, language switcher
  '/blog/': '2026-10-17',      // new posts / merged money post
  '/en/': '2026-10-18',        // now the translated home page (was a separate English landing)
  '/en/portfolio/': '2026-10-18', // English version created
  '/en/products/': '2026-10-18',  // English version created
  '/en/prices/': '2026-10-18',    // English version created
  '/en/contact/': '2026-10-18'    // English version created
};

// changefreq / priority per page, the same in every language.
const PAGE_SETTINGS = {
  '/': { changefreq: 'weekly', priority: '1.0' },
  '/portfolio/': { changefreq: 'daily', priority: '1' },
  '/products/': { changefreq: 'weekly', priority: '0.8' },
  '/prices/': { changefreq: 'monthly', priority: '0.7' },
  '/contact/': { changefreq: 'monthly', priority: '0.6' }
};
const BLOG_INDEX = { path: '/blog/', changefreq: 'weekly', priority: '0.9' };

/** Stops the build with a message (the CLI below turns it into exit code 1). */
function fail(message) {
  throw new Error(message);
}

/** [{ route, lastmod }] for every post in blog-posts.registry.ts. */
function readBlogPosts(registrySource) {
  if (!/export const BLOG_POSTS: BlogPost\[\] = \[/.test(registrySource)) {
    fail('Could not find the BLOG_POSTS array in blog-posts.registry.ts');
  }
  // Each registry entry is a flat `{ id: …, route: …, date: new Date('…'), … }` literal.
  const posts = [];
  for (const [block] of registrySource.matchAll(/\{\s*id:\s*'[^']*'[\s\S]*?\}/g)) {
    const route = (block.match(/route:\s*['"]([^'"]+)['"]/) || [])[1];
    const date = (block.match(/\bdate:\s*new Date\(['"]([^'"]+)['"]\)/) || [])[1];
    const dateModified = (block.match(/dateModified:\s*new Date\(['"]([^'"]+)['"]\)/) || [])[1];
    if (!route || !date) {
      fail(`Registry entry is missing route or date:\n${block}`);
    }
    posts.push({ route, lastmod: dateModified || date });
  }
  return posts;
}

/** '/prices/' in `code` → '/en/prices/'; the default language has no prefix. */
const localizedPath = (page, code, defaultLocale) => (code === defaultLocale ? page : `/${code}${page}`);

/**
 * The sitemap XML. Every localized page is listed once per language, each with
 * the full set of xhtml:link hreflang alternates (Google reads them from the
 * sitemap as well as from the page head); x-default is the Bulgarian page.
 */
function buildSitemap({ locales, posts, lastmod = MAIN_PAGE_LASTMOD }) {
  const { defaultLocale, localizedPages } = locales;
  const codes = locales.locales.map((l) => l.code);

  for (const page of localizedPages) {
    if (!PAGE_SETTINGS[page]) fail(`PAGE_SETTINGS has no entry for ${page} (scripts/generate-sitemap.js)`);
    for (const code of codes) {
      const loc = localizedPath(page, code, defaultLocale);
      if (!lastmod[loc]) fail(`MAIN_PAGE_LASTMOD has no entry for ${loc}`);
    }
  }
  if (!lastmod[BLOG_INDEX.path]) fail(`MAIN_PAGE_LASTMOD has no entry for ${BLOG_INDEX.path}`);

  const alternates = (page) => [
    ...codes.map((code) => `    <xhtml:link rel="alternate" hreflang="${code}" href="${SITE}${localizedPath(page, code, defaultLocale)}"/>`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${page}"/>`
  ].join('\n');

  const urlEntry = ({ loc, lastmod: date, changefreq, priority, links }) => `  <url>
    <loc>${SITE}${loc}</loc>
${links ? `${links}\n` : ''}    <lastmod>${date}T10:00:00+01:00</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

  const pagesIn = (code) => localizedPages.map((page) => urlEntry({
    loc: localizedPath(page, code, defaultLocale),
    lastmod: lastmod[localizedPath(page, code, defaultLocale)],
    ...PAGE_SETTINGS[page],
    links: alternates(page)
  })).join('\n');

  const otherLanguages = locales.locales
    .filter((l) => l.code !== defaultLocale)
    .map((l) => `  <!-- Main Pages: ${l.englishName} -->\n${pagesIn(l.code)}`)
    .join('\n\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <!-- Main Pages -->
${pagesIn(defaultLocale)}

${otherLanguages}

  <!-- Blog Pages (Bulgarian only) -->
${urlEntry({ loc: BLOG_INDEX.path, lastmod: lastmod[BLOG_INDEX.path], ...BLOG_INDEX })}
${posts.map((post) => urlEntry({
  loc: `${post.route.replace(/\/+$/, '')}/`,
  lastmod: post.lastmod,
  changefreq: 'monthly',
  priority: '0.8'
})).join('\n')}
</urlset>`;
}

if (require.main === module) {
  try {
    console.log('🔍 Generating sitemap from blog posts and src/i18n/locales.json...');
    const posts = readBlogPosts(fs.readFileSync(registryPath, 'utf8'));
    const locales = JSON.parse(fs.readFileSync(localesPath, 'utf8'));
    console.log(`✅ Found ${posts.length} blog posts`);

    fs.writeFileSync(sitemapPath, buildSitemap({ locales, posts }), 'utf8');

    const mainCount = locales.localizedPages.length * locales.locales.length;
    console.log('✅ Sitemap generated successfully at:', sitemapPath);
    console.log(`📝 Total URLs: ${posts.length + mainCount + 1} (${posts.length} blog posts + ${mainCount} main pages in ${locales.locales.length} languages + blog index)`);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
}

module.exports = { buildSitemap, readBlogPosts, MAIN_PAGE_LASTMOD };
