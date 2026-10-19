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

/**
 * A blog post's URL path in a language, by its Bulgarian slug ('/blog/<slug>/',
 * '/en/blog/<english-slug>/'), or null when it isn't translated into it
 * (`translatedPosts` in locales.json).
 */
function blogPostPath(source, code, locales) {
  if (code === locales.defaultLocale) return `/blog/${source}/`;
  const slug = locales.translatedPosts?.[code]?.[source];
  return slug ? `/${code}/blog/${slug}/` : null;
}

/** `[{ hreflang, href }]` for a blog post: each language it exists in plus x-default, or [] when it is only in Bulgarian. */
function blogPostAlternates(source, locales) {
  const versions = locales.locales
    .map(({ code }) => ({ code, path: blogPostPath(source, code, locales) }))
    .filter(({ path: p }) => p);
  if (versions.length < 2) return [];
  return [
    ...versions.map(({ code, path: p }) => ({ hreflang: code, href: `${SITE}${p}` })),
    { hreflang: 'x-default', href: `${SITE}${blogPostPath(source, locales.defaultLocale, locales)}` }
  ];
}

/** The Bulgarian slug of the blog post at a URL path ('/blog/x/', '/en/blog/y/'), or null for any other page. */
function blogPostSource(pathname, locales) {
  const match = /^(?:\/([a-z]{2,3}))?\/blog\/([^/]+)\/?$/.exec(pathname);
  if (!match) return null;
  const [, code, slug] = match;
  if (!code || code === locales.defaultLocale) return code ? null : slug;
  const entry = Object.entries(locales.translatedPosts?.[code] ?? {}).find(([, translated]) => translated === slug);
  return entry ? entry[0] : null;
}

module.exports = { SITE, readLocales, localizedPath, hreflangAlternates, blogPostPath, blogPostAlternates, blogPostSource };
