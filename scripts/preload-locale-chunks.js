// Post-build: preload each language's strings on its prerendered pages.
//
// A page in /en/… needs the English strings before the app can hydrate
// (provideI18n() loads them at startup), but they are a lazy chunk that only
// main.js asks for — so the browser fetches it after main.js has downloaded
// and run. Angular already preloads a route's own chunks; this adds
// <link rel="modulepreload"> for the language chunk and the chunks it imports
// to every page of that language, so they download in parallel with main.js.
// The same goes for the article texts on post pages (see run()).
// (LOCALIZATION-PLAN.md §7.)
//
// The chunk is found by a string only that language has (its menu-button
// label in src/i18n/<code>/shell.json), so its hashed file name never needs
// to be known. Runs as part of `postbuild`; idempotent.
//
//   node scripts/preload-locale-chunks.js [distDir]

const fs = require('fs');
const path = require('path');
const { readLocales } = require('./locale-urls');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_DIST = path.join(ROOT, 'dist', 'dprinting-services-website', 'browser');

/** A string as it can appear in a minified chunk: as is, or with non-ASCII escaped (\uXXXX). */
function spellings(text) {
  const escaped = text.replace(/[^\x20-\x7e]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`);
  return [...new Set([text, escaped])];
}

/** The language's unique marker: its menu button's accessible label. */
function markerFor(code) {
  const shell = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n', code, 'shell.json'), 'utf8'));
  return shell.navbar.openMenu;
}

/** The one chunk file in `chunks` ({ name: text }) that contains `marker`; throws on none or several. */
function findChunk(chunks, marker, code) {
  const forms = spellings(marker);
  const hits = Object.entries(chunks).filter(([, text]) => forms.some((form) => text.includes(form))).map(([name]) => name);
  if (hits.length !== 1) {
    throw new Error(`preload-locale-chunks: expected one chunk with the ${code} string "${marker}", found ${hits.length} (${hits.join(', ') || 'none'})`);
  }
  return hits[0];
}

/** The chunk files a chunk imports statically (`from "./chunk-X.js"`). */
function staticImports(text) {
  return [...new Set([...text.matchAll(/from\s*["']\.\/([\w.-]+\.js)["']/g)].map((m) => m[1]))];
}

/** The HTML with a modulepreload link for each file it doesn't preload yet, after its last one (or before </head>). */
function addPreloads(html, files) {
  const missing = files.filter((file) => !html.includes(`<link rel="modulepreload" href="${file}">`));
  if (!missing.length) return html;
  const links = missing.map((file) => `<link rel="modulepreload" href="${file}">`).join('');
  const lastPreload = html.lastIndexOf('<link rel="modulepreload"');
  if (lastPreload !== -1) {
    const end = html.indexOf('>', lastPreload) + 1;
    return html.slice(0, end) + links + html.slice(end);
  }
  return html.replace('</head>', `${links}</head>`);
}

function* indexFiles(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* indexFiles(full);
    else if (entry.name === 'index.html') yield full;
  }
}

/** Every post's page directory: blog/<slug> for each registry post, <code>/blog/<slug> for each translation. */
function postDirs(locales) {
  const { readBlogPosts } = require('./generate-sitemap');
  const registry = fs.readFileSync(path.join(ROOT, 'src/app/services/blog-posts.registry.ts'), 'utf8');
  return {
    bulgarian: readBlogPosts(registry).map((post) => `blog/${post.slug}`),
    translated: Object.entries(locales.translatedPosts ?? {}).flatMap(([code, slugs]) => Object.values(slugs).map((slug) => `${code}/blog/${slug}`))
  };
}

/** Adds `files` to each page (index.html under each of `dirs`); returns how many pages it saw. */
function preloadOn(distDir, pageFiles, files) {
  let pages = 0;
  for (const file of pageFiles) {
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    const updated = addPreloads(html, files);
    if (updated !== html) fs.writeFileSync(file, updated, 'utf8');
    pages++;
  }
  return pages;
}

/**
 * 1. Each other language's strings, on every page of that language.
 * 2. The article texts, on every post page: a post's route loads them in a
 *    resolver (src/app/blog/article/article.routes.ts), which Angular doesn't
 *    preload. Their generated modules carry a CHUNK_MARKER to be found by.
 */
function run(distDir = DEFAULT_DIST, { locales = readLocales(), marker = markerFor, posts = postDirs(locales) } = {}) {
  const chunks = Object.fromEntries(
    fs.readdirSync(distDir).filter((f) => f.endsWith('.js')).map((f) => [f, fs.readFileSync(path.join(distDir, f), 'utf8')])
  );
  const withImports = (chunk) => [chunk, ...staticImports(chunks[chunk])];
  const report = [];
  for (const { code } of locales.locales.filter((l) => l.code !== locales.defaultLocale)) {
    const chunk = findChunk(chunks, marker(code), code);
    const files = withImports(chunk);
    report.push({ what: `/${code}/ strings`, chunk, files: files.length, pages: preloadOn(distDir, indexFiles(path.join(distDir, code)), files) });
  }
  for (const [what, id, dirs] of [['Bulgarian posts', 'blog-content:bg', posts.bulgarian], ['translated posts', 'blog-content:translations', posts.translated]]) {
    if (!dirs.length) continue;
    const chunk = findChunk(chunks, id, what);
    const files = withImports(chunk);
    report.push({ what, chunk, files: files.length, pages: preloadOn(distDir, dirs.map((dir) => path.join(distDir, dir, 'index.html')), files) });
  }
  return report;
}

if (require.main === module) {
  try {
    for (const { what, chunk, files, pages } of run(path.resolve(process.argv[2] || DEFAULT_DIST))) {
      console.log(`✅ preload-locale-chunks: ${what} — ${chunk} (+${files - 1} imports) preloaded on ${pages} pages`);
    }
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
}

module.exports = { run, findChunk, staticImports, addPreloads, spellings };
