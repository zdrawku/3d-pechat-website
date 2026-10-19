import registry from '../../i18n/locales.json';
import { coreMessages } from '../../i18n/bg';
import type { LocaleBundle, PageNamespace, SourceBundle } from './i18n.types';

/**
 * Bulgarian, the source language: its core namespaces only (each page registers
 * its own — see src/i18n/bg/index.ts). Its content is src/data/ itself, so the
 * overlays are empty.
 */
export const BULGARIAN: SourceBundle = { messages: coreMessages, blog: {}, faq: {}, gallery: {}, products: {}, videos: {} };

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
 * Blog posts are not among them: each language has the posts in
 * {@link TRANSLATED_POSTS}, the rest exist only in Bulgarian.
 */
export const LOCALIZED_PAGES: readonly string[] = registry.localizedPages;

/**
 * The blog posts translated into each language: Bulgarian slug → that
 * language's slug (`translatedPosts` in src/i18n/locales.json). Each
 * translation is its own page at /<code>/blog/<slug>/, with its copy in
 * src/i18n/<code>/content/blog.json and its text in src/assets/blogs/<code>/<slug>.md.
 */
export const TRANSLATED_POSTS = registry.translatedPosts as Partial<Record<Locale, Readonly<Record<string, string>>>>;

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
 * and blog posts come back unchanged (a translation has its own slug, see
 * blogPostPath()). The input's trailing
 * slash style is kept, so slash-free routerLink values stay slash-free
 * (TrailingSlashUrlSerializer adds the slash).
 */
export function localizePath(path: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE || !isLocalizedPage(path)) {
    return path;
  }
  return `/${locale}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * A blog post's URL path in `locale`, by its Bulgarian slug, with a trailing
 * slash: ('pla-…', 'bg') → '/blog/pla-…/', ('pla-…', 'en') → '/en/blog/pla-vs-…/';
 * null when the post isn't translated into `locale`.
 */
export function blogPostPath(source: string, locale: Locale): string | null {
  if (locale === DEFAULT_LOCALE) {
    return `/blog/${source}/`;
  }
  const slug = TRANSLATED_POSTS[locale]?.[source];
  return slug ? `/${locale}/blog/${slug}/` : null;
}

/** The languages a blog post exists in, Bulgarian first. */
export function blogPostLocales(source: string): Locale[] {
  return LOCALES.map((l) => l.code).filter((code) => blogPostPath(source, code) !== null);
}

/**
 * The blog post a URL shows, as its language and Bulgarian slug:
 * '/en/blog/pla-vs-…/' → { locale: 'en', source: 'pla-…' }; null for any other
 * page, including the blog index and an English slug that isn't registered.
 */
export function blogPostAt(url: string): { locale: Locale; source: string } | null {
  const { locale, path } = splitLocalePath(url);
  const slug = /^\/blog\/([^/]+)\/?$/.exec(path)?.[1];
  if (!slug) {
    return null;
  }
  if (locale === DEFAULT_LOCALE) {
    return { locale, source: slug };
  }
  const source = Object.entries(TRANSLATED_POSTS[locale] ?? {}).find(([, translated]) => translated === slug)?.[0];
  return source ? { locale, source } : null;
}

/** A language version of a page, emitted as <link rel="alternate" hreflang>. */
export interface LanguageAlternate {
  hreflang: string;
  href: string;
}

/**
 * hreflang alternates for a page: one per language plus x-default (Bulgarian).
 * A blog post lists only the languages it is translated into, and none when it
 * exists only in Bulgarian. `path` may be any language's URL path.
 */
export function languageAlternates(path: string, origin: string): LanguageAlternate[] {
  const page = splitLocalePath(path).path;
  if (isLocalizedPage(page)) {
    const canonical = page === '/' ? '/' : `${withoutTrailingSlash(page)}/`;
    return [
      ...LOCALES.map((l) => ({ hreflang: l.code, href: `${origin}${localizePath(canonical, l.code)}` })),
      { hreflang: 'x-default', href: `${origin}${canonical}` }
    ];
  }
  const post = blogPostAt(path);
  const versions = post ? blogPostLocales(post.source) : [];
  if (!post || versions.length < 2) {
    return [];
  }
  return [
    ...versions.map((code) => ({ hreflang: code, href: `${origin}${blogPostPath(post.source, code)}` })),
    { hreflang: 'x-default', href: `${origin}${blogPostPath(post.source, DEFAULT_LOCALE)}` }
  ];
}

/**
 * Where the language switcher sends a visitor: the same page in `target`
 * (keeping a #fragment such as a product anchor); for a blog post its
 * translation, or that language's blog when there is none; otherwise that
 * language's home page.
 */
export function switchLocaleUrl(currentUrl: string, target: Locale): string {
  const [withoutFragment, fragment] = currentUrl.split('#');
  const { path } = splitLocalePath(withoutFragment);
  if (isLocalizedPage(path)) {
    const url = localizePath(path, target);
    return fragment ? `${url}#${fragment}` : url;
  }
  // A translated post's headings differ, so its #fragment can't carry over.
  const post = blogPostAt(withoutFragment);
  if (post) {
    return blogPostPath(post.source, target) ?? localizePath('/blog/', target);
  }
  return localizePath('/', target);
}
