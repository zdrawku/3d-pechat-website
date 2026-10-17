// Tells Bing (and Yandex, Seznam, Naver) about new or changed URLs via
// IndexNow, right after a deploy. ChatGPT's local answers start from a Bing
// search, so getting a page into Bing in hours instead of weeks matters.
// Google doesn't use IndexNow; it reads the sitemap.
//
// Usage (the deploy workflow runs this after `deploy-pages`):
//   node scripts/indexnow.js --sitemap <built sitemap.xml> [--prev <live sitemap before deploy>] [--all] [--dry-run]
//
// Only URLs that are new, whose <lastmod> changed, or that were removed versus
// --prev are sent;
// --all sends every URL (first run, or a manual re-submit). This relies on the
// hand-maintained, honest <lastmod> dates (CLAUDE.md Rule 5) — a build-date
// lastmod would resubmit everything on every deploy.
//
// The key is the name and content of public/<32 hex>.txt, which the build
// copies to https://3dpechat.bg/<key>.txt so IndexNow can verify ownership.
//
// IndexNow is a nice-to-have: this script ALWAYS exits 0 so it can never fail
// a deploy. Problems are logged as warnings.

const fs = require('fs');
const path = require('path');

const HOST = '3dpechat.bg';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const KEY_FILE_RE = /^([0-9a-f]{32})\.txt$/;
const MAX_URLS = 10000; // IndexNow limit per request

/** [{ loc, lastmod }] from sitemap XML; lastmod is '' when absent. */
function parseSitemap(xml) {
  if (!xml) return [];
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, body]) => ({
    loc: ((body.match(/<loc>\s*([^<]+?)\s*<\/loc>/) || [])[1]) || '',
    lastmod: ((body.match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/) || [])[1]) || ''
  })).filter((u) => u.loc);
}

/**
 * URLs to tell IndexNow about: new in nextXml, lastmod changed, or removed
 * (in prevXml but gone from nextXml). IndexNow wants deletions too — the
 * engine re-crawls and finds the legacy-redirect stub or the 404.
 */
function changedUrls(prevXml, nextXml) {
  const before = new Map(parseSitemap(prevXml).map((u) => [u.loc, u.lastmod]));
  const after = parseSitemap(nextXml);
  const now = new Set(after.map((u) => u.loc));
  const changed = after
    .filter((u) => !before.has(u.loc) || before.get(u.loc) !== u.lastmod)
    .map((u) => u.loc);
  const removed = [...before.keys()].filter((loc) => !now.has(loc));
  return [...changed, ...removed];
}

/** The IndexNow key from public/<key>.txt (file name and content must match). */
function findKey(publicDir) {
  const matches = fs.readdirSync(publicDir).filter((f) => KEY_FILE_RE.test(f));
  if (matches.length !== 1) {
    throw new Error(`expected exactly one <32-hex>.txt IndexNow key file in ${publicDir}, found ${matches.length}`);
  }
  const key = matches[0].match(KEY_FILE_RE)[1];
  const content = fs.readFileSync(path.join(publicDir, matches[0]), 'utf8').trim();
  if (content !== key) throw new Error(`${matches[0]} must contain exactly its own key`);
  return key;
}

function buildPayload(key, urls) {
  return {
    host: HOST,
    key,
    keyLocation: `https://${HOST}/${key}.txt`,
    urlList: urls.filter((u) => new URL(u).host === HOST).slice(0, MAX_URLS)
  };
}

function parseArgs(argv) {
  const args = { all: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--sitemap') args.sitemap = argv[++i];
    else if (argv[i] === '--prev') args.prev = argv[++i];
    else if (argv[i] === '--all') args.all = true;
    else if (argv[i] === '--dry-run') args.dryRun = true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(__dirname, '..');
  const sitemapPath = args.sitemap || path.join(root, 'src/sitemap.xml');
  const next = fs.readFileSync(sitemapPath, 'utf8');
  const prev = !args.all && args.prev && fs.existsSync(args.prev) ? fs.readFileSync(args.prev, 'utf8') : '';
  if (!args.all && !prev) console.log('[indexnow] no previous sitemap, submitting every URL');

  const urls = args.all ? parseSitemap(next).map((u) => u.loc) : changedUrls(prev, next);
  if (urls.length === 0) {
    console.log('[indexnow] no new or changed URLs, nothing to submit');
    return;
  }
  const key = findKey(path.join(root, 'public'));
  const payload = buildPayload(key, urls);
  console.log(`[indexnow] ${payload.urlList.length} URL(s):\n  ${payload.urlList.join('\n  ')}`);
  if (args.dryRun) {
    console.log('[indexnow] --dry-run: not sending');
    return;
  }

  // IndexNow verifies ownership by fetching the key file; check it's live first.
  const keyRes = await fetch(payload.keyLocation);
  const served = keyRes.ok ? (await keyRes.text()).trim() : '';
  if (served !== key) {
    console.warn(`::warning::[indexnow] ${payload.keyLocation} is not serving the key yet (HTTP ${keyRes.status}); skipping`);
    return;
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload)
  });
  // 200 = accepted, 202 = accepted, key validation pending.
  if (res.status === 200 || res.status === 202) {
    console.log(`[indexnow] submitted, HTTP ${res.status}`);
  } else {
    console.warn(`::warning::[indexnow] HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

if (require.main === module) {
  main().catch((err) => console.warn(`::warning::[indexnow] ${err.message}`)).finally(() => process.exit(0));
}

module.exports = { parseSitemap, changedUrls, findKey, buildPayload, parseArgs };
