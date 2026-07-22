const fs = require('fs');
const path = require('path');

// Read blog service to extract blog posts
const blogServicePath = path.join(__dirname, '../src/app/services/blog.service.ts');
const sitemapPath = path.join(__dirname, '../src/sitemap.xml');

console.log('🔍 Generating sitemap from blog posts...');

// This is a simple parser - adjust if your blog service structure changes
const blogServiceContent = fs.readFileSync(blogServicePath, 'utf8');

// Extract blog posts using regex (this matches the blogPosts array structure)
const blogPostsMatch = blogServiceContent.match(/private blogPosts: BlogPost\[\] = \[([\s\S]*?)\];/);

if (!blogPostsMatch) {
  console.error('❌ Could not find blogPosts array in blog.service.ts');
  process.exit(1);
}

// Parse blog posts (simple extraction)
const routes = [];
const routeMatches = blogServiceContent.matchAll(/route: ['"]([^'"]+)['"]/g);
const dateMatches = blogServiceContent.matchAll(/date: new Date\(['"]([^'"]+)['"]\)/g);

const routesArray = Array.from(routeMatches).map(m => m[1]);
const datesArray = Array.from(dateMatches).map(m => m[1]);

routesArray.forEach((route, index) => {
  routes.push({
    route: route,
    date: datesArray[index] || new Date().toISOString().split('T')[0]
  });
});

console.log(`✅ Found ${routes.length} blog posts`);

// Generate sitemap XML
const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main Pages -->
  <url>
    <loc>https://3dpechat.bg/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}T10:00:00+01:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://3dpechat.bg/portfolio/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}T10:00:00+01:00</lastmod>
    <changefreq>daily</changefreq>
    <priority>1</priority>
  </url>
  <url>
    <loc>https://3dpechat.bg/products/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}T10:00:00+01:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://3dpechat.bg/prices/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}T10:00:00+01:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://3dpechat.bg/contact/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}T10:00:00+01:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- Blog Pages -->
  <url>
    <loc>https://3dpechat.bg/blog/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}T10:00:00+01:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
${routes.map(blog => `  <url>
    <loc>https://3dpechat.bg${blog.route.replace(/\/+$/, '')}/</loc>
    <lastmod>${blog.date}T10:00:00+01:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

// Write sitemap
fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');

console.log('✅ Sitemap generated successfully at:', sitemapPath);
console.log(`📝 Total URLs: ${routes.length + 6} (${routes.length} blog posts + 6 main pages)`);
