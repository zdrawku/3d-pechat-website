// Post-build guard for internal link canonicalisation.
//
// The site prerenders to directories (blog/index.html) which GitHub Pages serves
// at /blog/ and 301-redirects /blog to. A crawlable internal link without the
// trailing slash is therefore a redirect hop that Googlebot reports as a
// "Redirect error" instead of indexing the target. This scans every prerendered
// dist/**/index.html and fails the build when it finds:
//
//   1. an internal href="/…" without a trailing slash
//      (ignored: paths whose last segment has a file extension, e.g. /favicon.ico
//       or /assets/x.webp; protocol-relative //host URLs; non-"/" schemes such as
//       mailto:, tel:, viber:; and the #fragment / ?query part, which doesn't
//       change which path is requested)
//   2. any 3dpechat.bg URL using the www host or plain http
//
// Runs as the `postbuild` npm script, so it also runs in the Pages workflow
// (`npm run build`). The same assertion is mirrored in e2e/seo.spec.ts.
//
//   node scripts/check-internal-links.js [distDir]

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_DIST = path.join(ROOT, 'dist', 'dprinting-services-website', 'browser');

const BAD_HOST = /https?:\/\/www\.3dpechat\.bg|http:\/\/(?:www\.)?3dpechat\.bg/gi;

/** True when `href` is a root-relative page path that is missing its trailing slash. */
function isSlashlessInternalHref(href) {
  if (!href.startsWith('/') || href.startsWith('//')) return false;
  const pathname = href.split(/[?#]/, 1)[0];
  if (pathname === '' || pathname.endsWith('/')) return false;
  const lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1);
  return !lastSegment.includes('.'); // has a file extension -> a file, not a page
}

/** Problems found in one prerendered HTML document. */
function findProblems(html) {
  const problems = [];
  const $ = cheerio.load(html);

  $('[href]').each((_, el) => {
    const href = ($(el).attr('href') || '').trim();
    if (isSlashlessInternalHref(href)) {
      problems.push(`internal href without trailing slash: ${href}`);
    }
  });

  for (const match of html.matchAll(BAD_HOST)) {
    problems.push(`non-canonical 3dpechat.bg URL (use https and no www): ${match[0]}`);
  }

  return [...new Set(problems)];
}

function* walkIndexFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') yield* walkIndexFiles(full);
    } else if (entry.name === 'index.html') {
      yield full;
    }
  }
}

function main() {
  const distDir = path.resolve(process.argv[2] || DEFAULT_DIST);
  if (!fs.existsSync(distDir)) {
    console.error(`check-internal-links: ${distDir} does not exist — run the build first.`);
    process.exit(1);
  }

  const files = [...walkIndexFiles(distDir)];
  if (files.length === 0) {
    console.error(`check-internal-links: no index.html files under ${distDir}.`);
    process.exit(1);
  }

  let failures = 0;
  for (const file of files) {
    const problems = findProblems(fs.readFileSync(file, 'utf8'));
    if (problems.length === 0) continue;
    failures += problems.length;
    console.error(`\n✖ ${path.relative(distDir, file) || 'index.html'}`);
    for (const p of problems) console.error(`    ${p}`);
  }

  if (failures > 0) {
    console.error(`\ncheck-internal-links: ${failures} problem(s) in ${files.length} page(s).`);
    process.exit(1);
  }
  console.log(`✅ check-internal-links: ${files.length} prerendered pages, all internal links canonical.`);
}

if (require.main === module) main();

module.exports = { findProblems, isSlashlessInternalHref };
