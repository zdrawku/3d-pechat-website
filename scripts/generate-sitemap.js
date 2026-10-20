const fs = require('fs');
const path = require('path');
const { SITE, blogPostAlternates, blogPostPath, hreflangAlternates, localizedPath, readLocales } = require('./locale-urls');

// Reads the blog registry (blog-posts.registry.ts) to list the blog posts,
// src/i18n/locales.json for the languages, the pages that exist in each and the
// translated posts, and src/i18n/<lang>/content/blog.json for those posts' dates.
const registryPath = path.join(__dirname, '../src/app/services/blog-posts.registry.ts');
const sitemapPath = path.join(__dirname, '../src/sitemap.xml');
const translationsFile = (code) => path.join(__dirname, `../src/i18n/${code}/content/blog.json`);

// <lastmod> for every main page in every language, maintained BY HAND: bump the
// date when a page's content or template meaningfully changes (a translation
// edit bumps only that language's URL). Do not derive these from git or from
// "today": the deploy checkout is shallow (every file would report the deploy
// date) and a lastmod that changes on every build teaches Google to ignore the
// field. Blog posts get theirs from `dateModified` in the registry, translated
// posts from `dateModified` in their language's blog.json.
const MAIN_PAGE_LASTMOD = {
  '/': '2026-10-18',          // hreflang → the English home page /en/, language switcher
  '/portfolio/': '2026-10-18', // hreflang → /en/portfolio/, language switcher
  '/products/': '2026-10-18',  // hreflang → /en/products/, language switcher
  '/prices/': '2026-10-18',    // hreflang → /en/prices/, language switcher
  '/contact/': '2026-10-18',   // hreflang → /en/contact/, language switcher
  '/blog/': '2026-10-19',      // hreflang → the English blog /en/blog/
  '/en/': '2026-10-19',        // now the translated home page (was a separate English landing); English gallery alt text
  '/en/portfolio/': '2026-10-19', // English version created; English gallery alt text
  '/en/products/': '2026-10-18',  // English version created
  '/en/prices/': '2026-10-18',    // English version created
  '/en/contact/': '2026-10-18',   // English version created
  '/en/blog/': '2026-10-19',      // English blog created (8 translated posts)
  '/privacy/': '2026-10-20',      // Privacy Policy created (src/legal/, LEGAL_DOCS in legal-page/legal-docs.ts)
  '/terms/': '2026-10-20',        // Terms of Use created
  '/en/privacy/': '2026-10-20',   // English Privacy Policy created
  '/en/terms/': '2026-10-20'      // English Terms of Use created
};

// changefreq / priority per page, the same in every language.
const PAGE_SETTINGS = {
  '/': { changefreq: 'weekly', priority: '1.0' },
  '/portfolio/': { changefreq: 'daily', priority: '1' },
  '/products/': { changefreq: 'weekly', priority: '0.8' },
  '/prices/': { changefreq: 'monthly', priority: '0.7' },
  '/contact/': { changefreq: 'monthly', priority: '0.6' },
  '/blog/': { changefreq: 'weekly', priority: '0.9' },
  '/privacy/': { changefreq: 'yearly', priority: '0.3' },
  '/terms/': { changefreq: 'yearly', priority: '0.3' }
};
const POST_SETTINGS = { changefreq: 'monthly', priority: '0.8' };

/** Stops the build with a message (the CLI below turns it into exit code 1). */
function fail(message) {
  throw new Error(message);
}

/** [{ slug, route, lastmod }] for every post in blog-posts.registry.ts. */
function readBlogPosts(registrySource) {
  if (!/export const BLOG_POSTS: BlogPost\[\] = \[/.test(registrySource)) {
    fail('Could not find the BLOG_POSTS array in blog-posts.registry.ts');
  }
  // Each registry entry is a flat `{ id: …, route: …, date: new Date('…'), … }` literal.
  const posts = [];
  for (const [block] of registrySource.matchAll(/\{\s*id:\s*'[^']*'[\s\S]*?\}/g)) {
    const slug = (block.match(/slug:\s*['"]([^'"]+)['"]/) || [])[1];
    const route = (block.match(/route:\s*['"]([^'"]+)['"]/) || [])[1];
    const date = (block.match(/\bdate:\s*new Date\(['"]([^'"]+)['"]\)/) || [])[1];
    const dateModified = (block.match(/dateModified:\s*new Date\(['"]([^'"]+)['"]\)/) || [])[1];
    if (!slug || !route || !date) {
      fail(`Registry entry is missing slug, route or date:\n${block}`);
    }
    posts.push({ slug, route, lastmod: dateModified || date });
  }
  return posts;
}

/** Every translated language's blog.json: { <code>: { <Bulgarian slug>: { dateModified, … } } }. */
function readTranslations(locales) {
  return Object.fromEntries(
    locales.locales
      .filter(({ code }) => code !== locales.defaultLocale)
      .map(({ code }) => [code, fs.existsSync(translationsFile(code)) ? JSON.parse(fs.readFileSync(translationsFile(code), 'utf8')) : {}])
  );
}

/**
 * The sitemap XML. Every localized page is listed once per language, each with
 * the full set of xhtml:link hreflang alternates (Google reads them from the
 * sitemap as well as from the page head); x-default is the Bulgarian page. A
 * blog post is listed in every language it is translated into, the versions
 * pointing at each other the same way; a Bulgarian-only post has no alternates.
 */
function buildSitemap({ locales, posts, translations = readTranslations(locales), lastmod = MAIN_PAGE_LASTMOD }) {
  const { defaultLocale, localizedPages } = locales;

  for (const page of localizedPages) {
    if (!PAGE_SETTINGS[page]) fail(`PAGE_SETTINGS has no entry for ${page} (scripts/generate-sitemap.js)`);
    for (const { code } of locales.locales) {
      const loc = localizedPath(page, code, locales);
      if (!lastmod[loc]) fail(`MAIN_PAGE_LASTMOD has no entry for ${loc}`);
    }
  }

  const links = (alternates) => alternates
    .map(({ hreflang, href }) => `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}"/>`)
    .join('\n');

  const urlEntry = ({ loc, lastmod: date, changefreq, priority, links: alternateLinks }) => `  <url>
    <loc>${SITE}${loc}</loc>
${alternateLinks ? `${alternateLinks}\n` : ''}    <lastmod>${date}T10:00:00+01:00</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

  const pagesIn = (code) => localizedPages.map((page) => {
    const loc = localizedPath(page, code, locales);
    return urlEntry({ loc, lastmod: lastmod[loc], ...PAGE_SETTINGS[page], links: links(hreflangAlternates(page, locales)) });
  }).join('\n');

  const otherLocales = locales.locales.filter((l) => l.code !== defaultLocale);

  const otherLanguages = otherLocales
    .map((l) => `  <!-- Main Pages: ${l.englishName} -->\n${pagesIn(l.code)}`)
    .join('\n\n');

  const postEntry = (post, loc, date) =>
    urlEntry({ loc, lastmod: date, ...POST_SETTINGS, links: links(blogPostAlternates(post.slug, locales)) });

  const bulgarianPosts = posts.map((post) => postEntry(post, `${post.route.replace(/\/+$/, '')}/`, post.lastmod)).join('\n');

  const translatedPosts = otherLocales.map(({ code, englishName }) => {
    const entries = posts.flatMap((post) => {
      const loc = blogPostPath(post.slug, code, locales);
      if (!loc) return [];
      const copy = translations[code]?.[post.slug];
      if (!copy?.dateModified) fail(`src/i18n/${code}/content/blog.json has no dateModified for "${post.slug}"`);
      return [postEntry(post, loc, copy.dateModified)];
    });
    return entries.length ? `\n\n  <!-- Blog Posts: ${englishName} -->\n${entries.join('\n')}` : '';
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <!-- Main Pages -->
${pagesIn(defaultLocale)}

${otherLanguages}

  <!-- Blog Posts -->
${bulgarianPosts}${translatedPosts}
</urlset>`;
}

if (require.main === module) {
  try {
    console.log('🔍 Generating sitemap from blog posts and src/i18n/locales.json...');
    const posts = readBlogPosts(fs.readFileSync(registryPath, 'utf8'));
    const locales = readLocales();
    console.log(`✅ Found ${posts.length} blog posts`);

    const xml = buildSitemap({ locales, posts });
    fs.writeFileSync(sitemapPath, xml, 'utf8');

    const mainCount = locales.localizedPages.length * locales.locales.length;
    const translatedCount = Object.values(locales.translatedPosts ?? {}).reduce((n, map) => n + Object.keys(map).length, 0);
    console.log('✅ Sitemap generated successfully at:', sitemapPath);
    console.log(`📝 Total URLs: ${mainCount + posts.length + translatedCount} (${mainCount} main pages in ${locales.locales.length} languages + ${posts.length} blog posts + ${translatedCount} translated posts)`);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
}

module.exports = { buildSitemap, readBlogPosts, readTranslations, MAIN_PAGE_LASTMOD };
