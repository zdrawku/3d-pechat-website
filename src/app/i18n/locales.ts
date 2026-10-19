import registry from '../../i18n/locales.json';
import { coreMessages } from '../../i18n/bg';
import type { LocaleBundle, PageNamespace, SourceBundle } from './i18n.types';

/**
 * Bulgarian, the source language: its core namespaces only (each page registers
 * its own — see src/i18n/bg/index.ts). Its content is src/data/ itself, so the
 * overlays are empty.
 */
export const BULGARIAN: SourceBundle = { messages: coreMessages, faq: {}, gallery: {}, products: {}, videos: {} };

/**
 * How each language is loaded. Bulgarian's core strings ship in the main bundle
 * (the default language, and what the unit tests render); every other language
 * is a lazy chunk fetched only when a visitor opens a page in it.
 *
 * Adding a language = an entry here + one in src/i18n/locales.json + its
 * src/i18n/<code>/ folder (see src/i18n/README.md). locales.spec.ts fails if the
 * two lists disagree.
 */
const LOADERS = {
  bg: () => Promise.resolve(BULGARIAN),
  en: () => import('../../i18n/en').then((m) => m.default)
} satisfies Record<string, () => Promise<LocaleBundle | SourceBundle>>;

/** A language code the site is available in ('bg' | 'en'). */
export type Locale = keyof typeof LOADERS;

/** One entry of src/i18n/locales.json. */
export interface LocaleDefinition {
  code: Locale;
  /** The language's own name („Български“, "English") — shown in the switcher. */
  label: string;
  /** English name, for docs and tooling. */
  englishName: string;
  /** og:locale value, e.g. bg_BG. */
  ogLocale: string;
  /** BCP 47 tag for Intl number, list, plural and date formatting, e.g. bg-BG. */
  intl: string;
}

export const DEFAULT_LOCALE = registry.defaultLocale as Locale;

/** Every language, default first (src/i18n/locales.json). */
export const LOCALES = registry.locales as readonly LocaleDefinition[];

/** Every language but the default one — each served under its own /<code>/ prefix. */
export const TRANSLATED_LOCALES = LOCALES.filter((l) => l.code !== DEFAULT_LOCALE);

/**
 * Pages that exist in every language, as Bulgarian paths with a trailing slash.
 * Everything else (the blog) is Bulgarian-only and has no language versions.
 */
export const LOCALIZED_PAGES: readonly string[] = registry.localizedPages;

/**
 * A page namespace's Bulgarian path: 'home' → '/', 'prices' → '/prices/'.
 * locales.spec.ts checks that the namespaces in seo.json map to exactly
 * LOCALIZED_PAGES.
 */
export function pagePath(page: PageNamespace): string {
  return page === 'home' ? '/' : `/${page}/`;
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(LOADERS, value);
}

export function loadLocale(locale: Locale): Promise<LocaleBundle | SourceBundle> {
  return LOADERS[locale]();
}

export function localeDefinition(locale: Locale): LocaleDefinition {
  return LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
}

const withoutTrailingSlash = (path: string): string => path.replace(/\/+$/, '') || '/';

/** LOCALIZED_PAGES normalised once, for isLocalizedPage() (it runs for every localizePath call). */
const LOCALIZED_PAGE_SET = new Set(LOCALIZED_PAGES.map(withoutTrailingSlash));

/**
 * Splits a URL path into its language and the Bulgarian path:
 * '/en/prices/' → { locale: 'en', path: '/prices/' }, '/en' → { 'en', '/' },
 * '/blog/x/' → { 'bg', '/blog/x/' }. Query and fragment are dropped.
 */
export function splitLocalePath(url: string): { locale: Locale; path: string } {
  const path = url.split(/[?#]/)[0] || '/';
  const match = /^\/([a-z]{2,3})(?=\/|$)/.exec(path);
  if (match && match[1] !== DEFAULT_LOCALE && isLocale(match[1])) {
    return { locale: match[1], path: path.slice(match[0].length) || '/' };
  }
  return { locale: DEFAULT_LOCALE, path };
}

/** True for a page that exists in every language (`localizedPages`), with or without a trailing slash. */
export function isLocalizedPage(path: string): boolean {
  return LOCALIZED_PAGE_SET.has(withoutTrailingSlash(path));
}

/**
 * The URL of a Bulgarian path in `locale`: '/prices' → '/en/prices',
 * '/prices/' → '/en/prices/', '/' → '/en/'. The default language has no prefix,
 * and Bulgarian-only pages (the blog) come back unchanged. The input's trailing
 * slash style is kept, so slash-free routerLink values stay slash-free
 * (TrailingSlashUrlSerializer adds the slash).
 */
export function localizePath(path: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE || !isLocalizedPage(path)) {
    return path;
  }
  return `/${locale}${path.startsWith('/') ? path : `/${path}`}`;
}

/** A language version of a page, emitted as <link rel="alternate" hreflang>. */
export interface LanguageAlternate {
  hreflang: string;
  href: string;
}

/**
 * hreflang alternates for a page: one per language plus x-default (Bulgarian),
 * or none for a Bulgarian-only page. `path` may be any language's URL path.
 */
export function languageAlternates(path: string, origin: string): LanguageAlternate[] {
  const page = splitLocalePath(path).path;
  if (!isLocalizedPage(page)) {
    return [];
  }
  const canonical = page === '/' ? '/' : `${withoutTrailingSlash(page)}/`;
  return [
    ...LOCALES.map((l) => ({ hreflang: l.code, href: `${origin}${localizePath(canonical, l.code)}` })),
    { hreflang: 'x-default', href: `${origin}${canonical}` }
  ];
}

/**
 * Where the language switcher sends a visitor: the same page in `target`
 * (keeping a #fragment such as a product anchor), or that language's home page
 * when the current page exists only in Bulgarian.
 */
export function switchLocaleUrl(currentUrl: string, target: Locale): string {
  const [withoutFragment, fragment] = currentUrl.split('#');
  const { path } = splitLocalePath(withoutFragment);
  const url = localizePath(isLocalizedPage(path) ? path : '/', target);
  return fragment ? `${url}#${fragment}` : url;
}
