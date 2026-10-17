const fs = require('fs');
const path = require('path');

// Reads the blog registry (blog-posts.registry.ts) to list the blog posts.
const registryPath = path.join(__dirname, '../src/app/services/blog-posts.registry.ts');
const sitemapPath = path.join(__dirname, '../src/sitemap.xml');

// <lastmod> for the six main pages, maintained BY HAND: bump the date when a
// page's content or template meaningfully changes. Do not derive these from git
// or from "today": the deploy checkout is shallow (every file would report the
// deploy date) and a lastmod that changes on every build teaches Google to
// ignore the field. Blog posts get theirs from `dateModified` in the registry.
const MAIN_PAGE_LASTMOD = {
  '/': '2026-10-17',          // CTA buttons became crawlable links (video section 10-14)
  '/portfolio/': '2026-10-17', // intro paragraph + section captions
  '/products/': '2026-10-14',  // euro coin holder added
  '/prices/': '2026-10-17',    // 3 € minimum order in the calculator
  '/contact/': '2026-10-17',   // H1 + intro + file note
  '/blog/': '2026-10-17',      // new posts / merged money post
  '/en/': '2026-10-17'         // English landing page created (Phase 5)
};

console.log('🔍 Generating sitemap from blog posts...');

const registrySource = fs.readFileSync(registryPath, 'utf8');

if (!/export const BLOG_POSTS: BlogPost\[\] = \[/.test(registrySource)) {
  console.error('❌ Could not find the BLOG_POSTS array in blog-posts.registry.ts');
  process.exit(1);
}

// Each registry entry is a flat `{ id: …, route: …, date: new Date('…'), … }` literal.
const routes = [];
for (const [block] of registrySource.matchAll(/\{\s*id:\s*'[^']*'[\s\S]*?\}/g)) {
  const route = (block.match(/route:\s*['"]([^'"]+)['"]/) || [])[1];
  const date = (block.match(/\bdate:\s*new Date\(['"]([^'"]+)['"]\)/) || [])[1];
  const dateModified = (block.match(/dateModified:\s*new Date\(['"]([^'"]+)['"]\)/) || [])[1];
  if (!route || !date) {
    console.error(`❌ Registry entry is missing route or date:\n${block}`);
    process.exit(1);
  }
  routes.push({ route, lastmod: dateModified || date });
}

console.log(`✅ Found ${routes.length} blog posts`);

const mainPages = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/portfolio/', changefreq: 'daily', priority: '1' },
  { path: '/products/', changefreq: 'weekly', priority: '0.8' },
  { path: '/prices/', changefreq: 'monthly', priority: '0.7' },
  { path: '/contact/', changefreq: 'monthly', priority: '0.6' },
  { path: '/en/', changefreq: 'monthly', priority: '0.6' }
];
const blogIndex = { path: '/blog/', changefreq: 'weekly', priority: '0.9' };

for (const page of [...mainPages, blogIndex]) {
  if (!MAIN_PAGE_LASTMOD[page.path]) {
    console.error(`❌ MAIN_PAGE_LASTMOD has no entry for ${page.path}`);
    process.exit(1);
  }
}

const urlEntry = ({ loc, lastmod, changefreq, priority }) => `  <url>
    <loc>https://3dpechat.bg${loc}</loc>
    <lastmod>${lastmod}T10:00:00+01:00</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main Pages -->
${mainPages.map(p => urlEntry({ loc: p.path, lastmod: MAIN_PAGE_LASTMOD[p.path], ...p })).join('\n')}

  <!-- Blog Pages -->
${urlEntry({ loc: blogIndex.path, lastmod: MAIN_PAGE_LASTMOD[blogIndex.path], ...blogIndex })}
${routes.map(blog => urlEntry({
  loc: `${blog.route.replace(/\/+$/, '')}/`,
  lastmod: blog.lastmod,
  changefreq: 'monthly',
  priority: '0.8'
})).join('\n')}
</urlset>`;

fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');

console.log('✅ Sitemap generated successfully at:', sitemapPath);
console.log(`📝 Total URLs: ${routes.length + mainPages.length + 1} (${routes.length} blog posts + ${mainPages.length + 1} main pages)`);
