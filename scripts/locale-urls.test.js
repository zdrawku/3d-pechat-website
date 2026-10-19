const { test } = require('node:test');
const assert = require('node:assert/strict');

const { SITE, readLocales, localizedPath, hreflangAlternates } = require('./locale-urls');

const locales = readLocales();

test('reads src/i18n/locales.json: Bulgarian first and default, the home page localized', () => {
  assert.equal(locales.defaultLocale, 'bg');
  assert.equal(locales.locales[0].code, 'bg');
  assert.ok(locales.locales.some((l) => l.code === 'en'));
  assert.ok(locales.localizedPages.includes('/'));
  assert.ok(locales.localizedPages.every((page) => page.endsWith('/')), 'canonical paths end with /');
});

test('prefixes every language but the default one', () => {
  assert.equal(localizedPath('/prices/', 'bg', locales), '/prices/');
  assert.equal(localizedPath('/prices/', 'en', locales), '/en/prices/');
  assert.equal(localizedPath('/', 'bg', locales), '/');
  assert.equal(localizedPath('/', 'en', locales), '/en/');
});

test('lists every language version, then x-default = the Bulgarian URL', () => {
  const alternates = hreflangAlternates('/prices/', locales);
  assert.equal(alternates.length, locales.locales.length + 1);
  assert.deepEqual(alternates.find((a) => a.hreflang === 'bg'), { hreflang: 'bg', href: `${SITE}/prices/` });
  assert.deepEqual(alternates.find((a) => a.hreflang === 'en'), { hreflang: 'en', href: `${SITE}/en/prices/` });
  assert.deepEqual(alternates.at(-1), { hreflang: 'x-default', href: `${SITE}/prices/` });
});
