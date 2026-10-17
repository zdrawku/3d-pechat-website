// Run with `npm run test:scripts` (node's built-in test runner).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { parseSitemap, changedUrls, findKey, buildPayload, parseArgs } = require('./indexnow');

const sitemap = (entries) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(([loc, lastmod]) => `  <url>
    <loc>${loc}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

test('parses loc and lastmod from a sitemap', () => {
  assert.deepEqual(parseSitemap(sitemap([['https://3dpechat.bg/', '2026-10-17T10:00:00+01:00'], ['https://3dpechat.bg/blog/', '']])), [
    { loc: 'https://3dpechat.bg/', lastmod: '2026-10-17T10:00:00+01:00' },
    { loc: 'https://3dpechat.bg/blog/', lastmod: '' }
  ]);
  assert.deepEqual(parseSitemap(''), []);
});

test('submits only new URLs and URLs whose lastmod changed', () => {
  const prev = sitemap([['https://3dpechat.bg/', '2026-10-12'], ['https://3dpechat.bg/prices/', '2026-07-31'], ['https://3dpechat.bg/old/', '2026-01-01']]);
  const next = sitemap([['https://3dpechat.bg/', '2026-10-12'], ['https://3dpechat.bg/prices/', '2026-10-17'], ['https://3dpechat.bg/blog/new-post/', '2026-10-17']]);
  assert.deepEqual(changedUrls(prev, next), ['https://3dpechat.bg/prices/', 'https://3dpechat.bg/blog/new-post/']);
});

test('with no previous sitemap every URL counts as changed', () => {
  const next = sitemap([['https://3dpechat.bg/', '2026-10-17'], ['https://3dpechat.bg/blog/', '2026-10-17']]);
  assert.deepEqual(changedUrls('', next), ['https://3dpechat.bg/', 'https://3dpechat.bg/blog/']);
});

test('reads the key from public/<key>.txt and rejects a mismatched file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'indexnow-'));
  const key = 'a'.repeat(32);
  fs.writeFileSync(path.join(dir, `${key}.txt`), key);
  fs.writeFileSync(path.join(dir, 'CNAME'), '3dpechat.bg');
  assert.equal(findKey(dir), key);
  fs.writeFileSync(path.join(dir, `${key}.txt`), 'wrong');
  assert.throws(() => findKey(dir), /must contain exactly its own key/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('the repo has exactly one valid key file', () => {
  assert.match(findKey(path.resolve(__dirname, '../public')), /^[0-9a-f]{32}$/);
});

test('builds the payload for our host only, with the key location', () => {
  const key = 'b'.repeat(32);
  assert.deepEqual(buildPayload(key, ['https://3dpechat.bg/', 'https://example.com/x']), {
    host: '3dpechat.bg',
    key,
    keyLocation: `https://3dpechat.bg/${key}.txt`,
    urlList: ['https://3dpechat.bg/']
  });
});

test('parses the CLI flags', () => {
  assert.deepEqual(parseArgs(['--sitemap', 's.xml', '--prev', 'p.xml', '--all', '--dry-run']), {
    sitemap: 's.xml', prev: 'p.xml', all: true, dryRun: true
  });
});
