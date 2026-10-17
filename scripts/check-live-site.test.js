// Run with `npm run test:scripts` (node's built-in test runner).
// Covers the pure helpers; the network checks run against production via
// `npm run check:live` (and the weekly live-site-check workflow).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseLegacyRedirects, robotsBlocksEverything, jsonLdBlocks, reviewMarkup, businessMismatches } = require('./check-live-site');
const business = require('../src/data/business.json');

test('reads every old → new pair from LEGACY_REDIRECTS.md', () => {
  const md = fs.readFileSync(path.resolve(__dirname, '../LEGACY_REDIRECTS.md'), 'utf8');
  const pairs = parseLegacyRedirects(md);
  assert.ok(pairs.length >= 2);
  for (const { from, to } of pairs) {
    assert.match(from, /^https:\/\/3dpechat\.bg\/.+\/$/);
    assert.match(to, /^https:\/\/3dpechat\.bg\/.+\/$/);
  }
});

test('detects a robots.txt that blocks the whole site for everyone', () => {
  assert.equal(robotsBlocksEverything('User-agent: *\nAllow: /\nSitemap: https://3dpechat.bg/sitemap.xml'), false);
  assert.equal(robotsBlocksEverything('User-agent: *\nDisallow: /'), true);
  assert.equal(robotsBlocksEverything('User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /'), false);
  assert.equal(robotsBlocksEverything('User-agent: *\nDisallow: /admin/'), false);
});

test('finds review / rating markup at any depth', () => {
  assert.deepEqual(reviewMarkup({ '@type': 'LocalBusiness', name: 'x' }), []);
  assert.deepEqual(reviewMarkup({ a: [{ aggregateRating: { ratingValue: 5 } }] }), ['$.a[0].aggregateRating']);
  assert.deepEqual(reviewMarkup({ '@graph': [{ '@type': 'Review' }] }), ['$.@graph[0].@type']);
});

test('parses every JSON-LD block of a page', () => {
  const html = `<head><script type="application/ld+json">{"@type":"A"}</script>
    <script type="application/ld+json" id="x">{"@graph":[{"@type":"B"}]}</script></head>`;
  assert.deepEqual(jsonLdBlocks(html), [{ '@type': 'A' }, { '@graph': [{ '@type': 'B' }] }]);
});

test('compares the live schema with business.json', () => {
  const live = {
    '@type': 'LocalBusiness',
    name: business.name,
    telephone: business.telephone,
    address: { ...business.address },
    sameAs: business.sameAs,
    priceRange: business.priceRange
  };
  assert.deepEqual(businessMismatches(live, business), []);
  assert.equal(businessMismatches({ ...live, name: 'Old name' }, business).length, 1);
});
