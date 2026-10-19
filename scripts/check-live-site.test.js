// Run with `npm run test:scripts` (node's built-in test runner).
// Covers the pure helpers; the network checks run against production via
// `npm run check:live` (and the weekly live-site-check workflow).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cheerio = require('cheerio');
const { parseLegacyRedirects, robotsBlocksEverything, jsonLdBlocks, reviewMarkup, businessMismatches, expectedLanguage, languageProblems, missingLanguageVersions } = require('./check-live-site');
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

const locales = require('../src/i18n/locales.json');
// A page with this <html lang> and one hreflang link per [hreflang, href].
const page = (lang, links) => `<html lang="${lang}"><head>${links.map(([h, href]) => `<link rel="alternate" hreflang="${h}" href="${href}">`).join('')}</head></html>`;
// The home page's hreflang set (both languages carry it), in the app's order.
const homeLinks = [['bg', 'https://3dpechat.bg/'], ['en', 'https://3dpechat.bg/en/'], ['x-default', 'https://3dpechat.bg/']];

test('expects each language version of a main page to list all of them, x-default = Bulgarian', () => {
  const pricesSet = ['bg https://3dpechat.bg/prices/', 'en https://3dpechat.bg/en/prices/', 'x-default https://3dpechat.bg/prices/'];
  assert.deepEqual(expectedLanguage('https://3dpechat.bg/prices/', locales), { lang: 'bg', alternates: pricesSet });
  assert.deepEqual(expectedLanguage('https://3dpechat.bg/en/prices/', locales), { lang: 'en', alternates: pricesSet });
  assert.deepEqual(expectedLanguage('https://3dpechat.bg/en/', locales).alternates,
    ['bg https://3dpechat.bg/', 'en https://3dpechat.bg/en/', 'x-default https://3dpechat.bg/']);
});

test('expects a Bulgarian-only post to carry no hreflang', () => {
  assert.deepEqual(expectedLanguage('https://3dpechat.bg/blog/what-is-3d-printing/', locales), { lang: 'bg', alternates: [] });
});

test('expects a translated post and its original to list each other, x-default = Bulgarian', () => {
  const bg = 'https://3dpechat.bg/blog/pla-pla-pla-pro-i-pln-razliki-i-izbor/';
  const en = 'https://3dpechat.bg/en/blog/pla-vs-pla-plus-vs-pla-pro-vs-pln/';
  const pair = [`bg ${bg}`, `en ${en}`, `x-default ${bg}`];
  assert.deepEqual(expectedLanguage(bg, locales), { lang: 'bg', alternates: pair });
  assert.deepEqual(expectedLanguage(en, locales), { lang: 'en', alternates: pair });
  // An English slug that isn't registered pairs with nothing.
  assert.deepEqual(expectedLanguage('https://3dpechat.bg/en/blog/unknown/', locales), { lang: 'en', alternates: [] });
});

test('reports a wrong <html lang> or a missing / extra hreflang link', () => {
  const good = page('en', homeLinks);
  assert.deepEqual(languageProblems(cheerio.load(good), 'https://3dpechat.bg/en/', locales), []);

  const wrongLang = good.replace('lang="en"', 'lang="bg"');
  assert.equal(languageProblems(cheerio.load(wrongLang), 'https://3dpechat.bg/en/', locales).length, 1);

  const blogWithHreflang = page('bg', [['en', 'https://3dpechat.bg/en/']]);
  assert.match(languageProblems(cheerio.load(blogWithHreflang), 'https://3dpechat.bg/blog/x/', locales)[0], /hreflang/);
});

test('accepts the hreflang links in any order', () => {
  const [bg, en, xDefault] = homeLinks;
  for (const links of [[xDefault, en, bg], [en, xDefault, bg]]) {
    assert.deepEqual(languageProblems(cheerio.load(page('en', links)), 'https://3dpechat.bg/en/', locales), []);
  }
});

test('reports a missing, an extra or a duplicate hreflang link in any order', () => {
  const [bg, en, xDefault] = homeLinks;
  const cases = {
    missing: [xDefault, bg],
    extra: [xDefault, ['de', 'https://3dpechat.bg/de/'], en, bg],
    duplicate: [en, xDefault, en, bg]
  };
  for (const [kind, links] of Object.entries(cases)) {
    const problems = languageProblems(cheerio.load(page('en', links)), 'https://3dpechat.bg/en/', locales);
    assert.equal(problems.length, 1, `${kind} link`);
    assert.match(problems[0], /^hreflang \[/, `${kind} link`);
  }
});

// What a correct sitemap lists: every language version of every localized page
// (the default language unprefixed), the Bulgarian posts and their translations.
const translatedPostLocs = Object.entries(locales.translatedPosts)
  .flatMap(([code, slugs]) => Object.values(slugs).map((slug) => `https://3dpechat.bg/${code}/blog/${slug}/`));
const sitemapLocs = [
  ...locales.localizedPages.flatMap((p) => locales.locales.map(({ code }) => `https://3dpechat.bg${code === locales.defaultLocale ? '' : `/${code}`}${p}`)),
  'https://3dpechat.bg/blog/what-is-3d-printing/',
  ...translatedPostLocs
];

test('finds no missing language version in a sitemap that lists them all', () => {
  assert.deepEqual(missingLanguageVersions(sitemapLocs, locales), []);
});

test('reports exactly the language versions a sitemap drops', () => {
  const withoutEnPrices = sitemapLocs.filter((loc) => loc !== 'https://3dpechat.bg/en/prices/');
  assert.equal(withoutEnPrices.length, sitemapLocs.length - 1);
  assert.deepEqual(missingLanguageVersions(withoutEnPrices, locales), ['https://3dpechat.bg/en/prices/']);

  const withoutEnglish = sitemapLocs.filter((loc) => !loc.startsWith('https://3dpechat.bg/en/'));
  assert.deepEqual(missingLanguageVersions(withoutEnglish, locales), [
    ...locales.localizedPages.map((p) => `https://3dpechat.bg/en${p}`),
    ...translatedPostLocs
  ]);
});
