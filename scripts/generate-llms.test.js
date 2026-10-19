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

test('links every localized page in that language, at its canonical URL', () => {
  const hrefs = sections.map((line) => (line.match(/^- \[[^\]]+\]\(([^)]+)\)/) || [])[1]).filter(Boolean);
  assert.deepEqual(hrefs, locales.localizedPages.map((page) => `https://3dpechat.bg/en${page}`));
  assert.ok(sections.includes('- [Prices](https://3dpechat.bg/en/prices/): Prices by weight, a price calculator and the FAQ in English.'));
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
