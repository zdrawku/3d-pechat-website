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

const { expectedLanguage, languageProblems } = require('./check-live-site');
const locales = require('../src/i18n/locales.json');

test('expects each language version of a main page to list all of them, x-default = Bulgarian', () => {
  const pricesSet = ['bg https://3dpechat.bg/prices/', 'en https://3dpechat.bg/en/prices/', 'x-default https://3dpechat.bg/prices/'];
  assert.deepEqual(expectedLanguage('https://3dpechat.bg/prices/', locales), { lang: 'bg', alternates: pricesSet });
  assert.deepEqual(expectedLanguage('https://3dpechat.bg/en/prices/', locales), { lang: 'en', alternates: pricesSet });
  assert.deepEqual(expectedLanguage('https://3dpechat.bg/en/', locales).alternates,
    ['bg https://3dpechat.bg/', 'en https://3dpechat.bg/en/', 'x-default https://3dpechat.bg/']);
});

test('expects the Bulgarian-only blog to carry no hreflang', () => {
  assert.deepEqual(expectedLanguage('https://3dpechat.bg/blog/what-is-3d-printing/', locales), { lang: 'bg', alternates: [] });
});

test('reports a wrong <html lang> or a missing / extra hreflang link', () => {
  const page = (lang, links) => `<html lang="${lang}"><head>${links.map(([h, href]) => `<link rel="alternate" hreflang="${h}" href="${href}">`).join('')}</head></html>`;
  const good = page('en', [['bg', 'https://3dpechat.bg/'], ['en', 'https://3dpechat.bg/en/'], ['x-default', 'https://3dpechat.bg/']]);
  assert.deepEqual(languageProblems(good, 'https://3dpechat.bg/en/', locales), []);

  const wrongLang = good.replace('lang="en"', 'lang="bg"');
  assert.equal(languageProblems(wrongLang, 'https://3dpechat.bg/en/', locales).length, 1);

  const blogWithHreflang = page('bg', [['en', 'https://3dpechat.bg/en/']]);
  assert.match(languageProblems(blogWithHreflang, 'https://3dpechat.bg/blog/x/', locales)[0], /hreflang/);
});
