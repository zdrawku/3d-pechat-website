const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { languageSections } = require('./generate-llms');
const { readLocales } = require('./locale-urls');

const ROOT = path.join(__dirname, '..');
const locales = readLocales();
const sections = languageSections(locales);

test('adds one section per non-default language, none for Bulgarian', () => {
  const headings = sections.filter((line) => line.startsWith('## '));
  assert.deepEqual(headings, ['## English']);
});

const hrefsIn = (lines) => lines.map((line) => (line.match(/^- \[[^\]]+\]\(([^)]+)\)/) || [])[1]).filter(Boolean);
const postsHeading = sections.indexOf('### Blog articles in English');

test('links every localized page in that language, at its canonical URL', () => {
  assert.deepEqual(hrefsIn(sections.slice(0, postsHeading)), locales.localizedPages.map((page) => `https://3dpechat.bg/en${page}`));
  assert.ok(sections.includes('- [Prices](https://3dpechat.bg/en/prices/): Prices by weight, a price calculator and the FAQ in English.'));
});

test('then lists every post translated into that language, at its own URL', () => {
  assert.ok(postsHeading > 0);
  assert.deepEqual(hrefsIn(sections.slice(postsHeading)),
    Object.values(locales.translatedPosts.en).map((slug) => `https://3dpechat.bg/en/blog/${slug}/`));
  const missingCopy = () => languageSections(locales, () => ({}));
  assert.throws(missingCopy, /has no copy for/);
});

test('fails loudly when a language or a localized page has no copy', () => {
  const withGerman = { ...locales, locales: [...locales.locales, { code: 'de', label: 'Deutsch' }] };
  assert.throws(() => languageSections(withGerman), /no LANGUAGE_PAGES entry for "de"/);
  const withNewPage = { ...locales, localizedPages: [...locales.localizedPages, '/services/'] };
  assert.throws(() => languageSections(withNewPage), /no en label\/description for \/services\//);
});

test('src/llms.txt carries the current language sections (run the generator if this fails)', () => {
  const llms = fs.readFileSync(path.join(ROOT, 'src/llms.txt'), 'utf8').replace(/\r\n/g, '\n');
  assert.ok(llms.includes(sections.join('\n')));
});
