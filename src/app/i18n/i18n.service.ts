import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

import type {
  LocaleBundle,
  LocaleContent,
  PageMessages,
  PageNamespace,
  PluralKey,
  SourceBundle,
  TranslationKey,
  TranslationParams
} from './i18n.types';
import { BULGARIAN, DEFAULT_LOCALE, LOCALES, Locale, LocaleDefinition, loadLocale, localeDefinition, localizePath } from './locales';

/** `{name}` → params.name; unknown placeholders stay visible so a missing param is easy to spot. */
export function interpolate(message: string, params: TranslationParams): string {
  return message.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
  );
}

/** Nested messages → 'a.b.c' → string, built once per language for O(1) lookups. */
export function flatten(tree: object, prefix = '', out = new Map<string, string>()): Map<string, string> {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      out.set(path, value);
    } else if (value && typeof value === 'object') {
      flatten(value, path, out);
    }
  }
  return out;
}

/**
 * The site's runtime translations (see src/i18n/README.md).
 *
 * The language comes from the URL: '/…' is Bulgarian, '/en/…' English. It is
 * set before anything renders — by `provideI18n()` at bootstrap and by
 * `localeGuard` on every navigation into another language — so the prerendered
 * HTML and the hydrating client always agree; after every navigation
 * `provideI18n()` re-reads it from the URL of the page shown. Templates read
 * strings through the `t` pipe; code calls `t()` / `plural()`.
 *
 * Also owns `<html lang>`, so every page (including ones that never call
 * SeoService) carries the right language, during prerender as well.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly bundles = new Map<Locale, LocaleContent>();
  private readonly messages = new Map<Locale, Map<string, string>>();
  private readonly pending = new Map<Locale, Promise<void>>();
  private readonly registeredPages = new Set<PageNamespace>();
  private readonly formatters = new Map<string, object>();
  private readonly current = signal<Locale>(DEFAULT_LOCALE);
  /** The language last asked for: an earlier `use()` that finishes loading later must not override it. */
  private requested: Locale = DEFAULT_LOCALE;

  /** The active language. */
  readonly locale = this.current.asReadonly();

  /** The active language's entry in src/i18n/locales.json. */
  readonly definition = computed<LocaleDefinition>(() => localeDefinition(this.current()));

  /** Every language but the active one (the footer links, og:locale:alternate). */
  readonly otherLocales = computed(() => LOCALES.filter((l) => l.code !== this.current()));

  /** The active language's content overlays: FAQ, product and video copy (empty for Bulgarian, the source). */
  readonly content = computed<LocaleContent>(() => this.bundles.get(this.current()) ?? BULGARIAN);

  constructor() {
    this.register(DEFAULT_LOCALE, BULGARIAN);
  }

  /**
   * Loads `locale` (once) and makes it the active language — unless another
   * language was asked for while it loaded: the latest call wins.
   */
  async use(locale: Locale): Promise<void> {
    this.requested = locale;
    await this.load(locale);
    if (this.requested !== locale) {
      return;
    }
    this.current.set(locale);
    this.document.documentElement.setAttribute('lang', locale);
  }

  /** Fetches a language's strings without switching to it. */
  load(locale: Locale): Promise<void> {
    if (this.bundles.has(locale)) {
      return Promise.resolve();
    }
    let loading = this.pending.get(locale);
    if (!loading) {
      loading = loadLocale(locale)
        .then((bundle) => this.register(locale, bundle))
        .finally(() => this.pending.delete(locale));
      this.pending.set(locale, loading);
    }
    return loading;
  }

  /** The message for `key` in the active language, with `{placeholders}` filled from `params`. */
  t(key: TranslationKey, params?: TranslationParams): string {
    const message = this.lookup(key) ?? key;
    return params ? interpolate(message, params) : message;
  }

  /**
   * A plural group ('reviews.count' → { one, other }) for `count`, chosen by the
   * language's plural rules. `{count}` is filled in automatically.
   */
  plural(key: PluralKey, count: number, params?: TranslationParams): string {
    const form = this.formatter('plural', () => new Intl.PluralRules(this.definition().intl));
    const message = this.lookup(`${key}.${form.select(count)}`) ?? this.lookup(`${key}.other`) ?? key;
    return interpolate(message, { count, ...params });
  }

  /** A number in the active language's format: 0.8 → „0,80“ / "0.80" with `{ minimumFractionDigits: 2 }`. */
  formatNumber(value: number, options: Intl.NumberFormatOptions = {}): string {
    const key = `number:${JSON.stringify(options)}`;
    return this.formatter(key, () => new Intl.NumberFormat(this.definition().intl, options)).format(value);
  }

  /** ['STL', 'OBJ', 'STEP'] → „STL, OBJ или STEP“ / "STL, OBJ, or STEP". */
  formatList(items: readonly string[], type: 'conjunction' | 'disjunction' = 'conjunction'): string {
    return this.formatter(`list:${type}`, () => new Intl.ListFormat(this.definition().intl, { type })).format(items);
  }

  /** Month name in the active language (1 = January), e.g. „май“ / "May". */
  monthName(month: number): string {
    const format = this.formatter('month', () =>
      new Intl.DateTimeFormat(this.definition().intl, { month: 'long', timeZone: 'UTC' })
    );
    return format.format(new Date(Date.UTC(2000, month - 1, 1)));
  }

  /** A Bulgarian path in the active language: '/prices' → '/en/prices' on English pages. */
  path(path: string): string {
    return localizePath(path, this.current());
  }

  /**
   * `lang` for content written in `lang` (Bulgarian by default): that code when
   * the page is in another language, null on a page in that language. Marks
   * Bulgarian-only content on English pages — `[attr.lang]` / `[attr.hreflang]`.
   */
  langIfForeign(lang: string = DEFAULT_LOCALE): string | null {
    return this.current() === lang ? null : lang;
  }

  /**
   * Adds a page's Bulgarian strings (src/i18n/bg/<page>.json). Each page
   * component calls this as it is created, so its text ships in its own lazy
   * chunk instead of the main bundle; Bulgarian is also every language's
   * fallback. Calling it again is harmless.
   */
  registerPage<N extends PageNamespace>(namespace: N, pageMessages: PageMessages[N]): void {
    const source = this.messages.get(DEFAULT_LOCALE);
    if (source && !this.registeredPages.has(namespace)) {
      flatten(pageMessages, namespace, source);
      this.registeredPages.add(namespace);
    }
  }

  private register(locale: Locale, bundle: LocaleBundle | SourceBundle): void {
    this.bundles.set(locale, bundle);
    this.messages.set(locale, flatten(bundle.messages));
  }

  /** Active language first, then Bulgarian, so a gap can never show a raw key. */
  private lookup(key: string): string | undefined {
    return this.messages.get(this.current())?.get(key) ?? this.messages.get(DEFAULT_LOCALE)?.get(key);
  }

  /** Intl objects are costly to build; keep one per language and options. */
  private formatter<T extends object>(name: string, create: () => T): T {
    const key = `${this.current()}|${name}`;
    let format = this.formatters.get(key) as T | undefined;
    if (!format) {
      format = create();
      this.formatters.set(key, format);
    }
    return format;
  }
}
