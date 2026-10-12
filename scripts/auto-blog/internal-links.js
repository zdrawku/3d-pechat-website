// Keeps the generated article's internal links pointing at pages that exist.
//
// Left to itself the model invents plausible-looking slugs
// (/blog/sla-vs-fdm-razliki, /blog/3d-printing-services, …) that 404. So the
// prompt gets the real list of posts, and whatever comes back is checked
// against app.routes.ts: unknown internal links are unwrapped to plain text,
// known ones are normalised to the canonical trailing-slash form.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const ROUTES_FILE = path.join(ROOT, 'src/app/app.routes.ts');
const SERVICE_FILE = path.join(ROOT, 'src/app/services/blog-posts.registry.ts');

const STATIC_PAGES = [
  { path: '/products/', title: 'Продукти' },
  { path: '/prices/', title: 'Цени' },
  { path: '/portfolio/', title: 'Портфолио' },
  { path: '/contact/', title: 'Контакт' },
  { path: '/blog/', title: 'Блог' }
];

/** Existing blog posts as { path, title }, read from blog-posts.registry.ts. */
function getBlogPosts() {
  const src = fs.readFileSync(SERVICE_FILE, 'utf8');
  const posts = [];
  const re = /title:\s*'((?:[^'\\]|\\.)*)'[\s\S]*?route:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src))) {
    posts.push({ path: `${m[2].replace(/\/$/, '')}/`, title: m[1].replace(/\\'/g, "'") });
  }
  return posts;
}

/** Static pages that are actually routed (app.routes.ts declares them). */
function getStaticPages() {
  const routes = fs.readFileSync(ROUTES_FILE, 'utf8');
  return STATIC_PAGES.filter(p => routes.includes(`path: '${p.path.replace(/\//g, '')}'`));
}

/** Every page a generated article may link to, in canonical trailing-slash form. */
function getValidPaths() {
  return new Set(['/', ...getStaticPages().map(p => p.path), ...getBlogPosts().map(p => p.path)]);
}

/**
 * Rewrites markdown links to this site. Returns the fixed markdown plus the
 * links that were dropped, so the caller can log them.
 */
function fixInternalLinks(markdown, validPaths = getValidPaths()) {
  const dropped = [];
  const fixed = markdown.replace(
    /(!?)\[([^\]]+)\]\((?:https?:\/\/(?:www\.)?3dpechat\.bg)?(\/[^)\s#?]*)([#?][^)\s]*)?\)/g,
    (whole, bang, text, rawPath, suffix = '') => {
      // Images and file links (/assets/x.webp, /sitemap.xml) are not pages.
      if (bang || /\.[a-z0-9]+$/i.test(rawPath)) return whole;
      const canonical = `${rawPath.replace(/\/+$/, '')}/`.replace(/^\/\/$/, '/');
      if (!validPaths.has(canonical)) {
        dropped.push(rawPath);
        return text;
      }
      return `[${text}](${canonical}${suffix})`;
    }
  );
  return { markdown: fixed, dropped };
}

module.exports = { getBlogPosts, getStaticPages, getValidPaths, fixInternalLinks };
