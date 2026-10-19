// Language URLs for the Node scripts — the sitemap, llms.txt and the live
// check — from src/i18n/locales.json. Same rules as src/app/i18n/locales.ts in
// the Angular app (which can't load this CommonJS module); the unit tests on
// both sides assert the same URL sets, so the two stay in step.

const fs = require('fs');
const path = require('path');

const SITE = 'https://3dpechat.bg';
const LOCALES_FILE = path.join(__dirname, '../src/i18n/locales.json');

/** src/i18n/locales.json: `{ defaultLocale, locales: [{ code, … }], localizedPages }`. */
function readLocales() {
  return JSON.parse(fs.readFileSync(LOCALES_FILE, 'utf8'));
}

/** A Bulgarian page path in a language: '/prices/' → '/en/prices/'. The default language has no prefix. */
function localizedPath(page, code, locales) {
  return code === locales.defaultLocale ? page : `/${code}${page}`;
}

/** `[{ hreflang, href }]` for a localized page: one per language, plus x-default (the default language). */
function hreflangAlternates(page, locales) {
  return [
    ...locales.locales.map((l) => ({ hreflang: l.code, href: `${SITE}${localizedPath(page, l.code, locales)}` })),
    { hreflang: 'x-default', href: `${SITE}${page}` }
  ];
}

module.exports = { SITE, readLocales, localizedPath, hreflangAlternates };
