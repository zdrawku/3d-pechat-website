import registry from '../../i18n/locales.json';
import { coreMessages } from '../../i18n/bg';
import type { PageNamespace } from './i18n.types';
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALIZED_PAGES,
  TRANSLATED_LOCALES,
  TRANSLATED_POSTS,
  blogPostAt,
  blogPostLocales,
  blogPostPath,
  isLocale,
  isLocalizedPage,
  languageAlternates,
  loadLocale,
  localeDefinition,
  localizePath,
  pagePath,
  splitLocalePath,
  switchLocaleUrl
} from './locales';

describe('locales', () => {
  describe('registry (src/i18n/locales.json)', () => {
    it('lists Bulgarian first, as the default language', () => {
      expect(DEFAULT_LOCALE).toBe('bg');
      expect(LOCALES[0].code).toBe(DEFAULT_LOCALE);
      expect(TRANSLATED_LOCALES.map(l => l.code)).toEqual(LOCALES.slice(1).map(l => l.code));
    });

    it('has a loader for every language and a language for every loader', async () => {
      const codes = registry.locales.map(l => l.code);
      expect(new Set(codes).size).withContext('unique codes').toBe(codes.length);
      for (const code of codes) {
        expect(isLocale(code)).withContext(`${code}: add a loader in src/app/i18n/locales.ts`).toBeTrue();
        if (isLocale(code)) {
          const bundle = await loadLocale(code);
          expect(bundle.messages).withContext(code).toBeDefined();
        }
      }
      expect(isLocale('de')).toBeFalse();
      expect(isLocale('toString')).toBeFalse();
    });

    it('gives every language a label in its own name, an og:locale and an Intl tag', () => {
      for (const l of LOCALES) {
        expect(l.label.trim().length).withContext(l.code).toBeGreaterThan(0);
        expect(l.ogLocale).withContext(l.code).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
        expect(() => new Intl.NumberFormat(l.intl)).withContext(l.code).not.toThrow();
      }
      expect(localeDefinition('bg').label).toBe('Български');
      expect(localeDefinition('en').label).toBe('English');
    });

    it('localises exactly the pages that have meta copy (seo.json), at their pagePath()', () => {
      const pages = Object.keys(coreMessages.seo) as PageNamespace[];
      expect([...LOCALIZED_PAGES].sort()).toEqual(pages.map(pagePath).sort());
      expect(pagePath('home')).toBe('/');
      expect(pagePath('prices')).toBe('/prices/');
    });
  });

  describe('URLs', () => {
    it('splits a URL into its language and the Bulgarian path', () => {
      expect(splitLocalePath('/')).toEqual({ locale: 'bg', path: '/' });
      expect(splitLocalePath('/prices/')).toEqual({ locale: 'bg', path: '/prices/' });
      expect(splitLocalePath('/en')).toEqual({ locale: 'en', path: '/' });
      expect(splitLocalePath('/en/')).toEqual({ locale: 'en', path: '/' });
      expect(splitLocalePath('/en/prices/?x=1#faq')).toEqual({ locale: 'en', path: '/prices/' });
      expect(splitLocalePath('/blog/what-is-3d-printing/')).toEqual({ locale: 'bg', path: '/blog/what-is-3d-printing/' });
      // Only registered codes count as a prefix; '/bg/' is not a URL of the site.
      expect(splitLocalePath('/de/prices/').locale).toBe('bg');
      expect(splitLocalePath('/bg/prices/').locale).toBe('bg');
    });

    it('knows which pages exist in every language', () => {
      expect(isLocalizedPage('/')).toBeTrue();
      expect(isLocalizedPage('/prices')).toBeTrue();
      expect(isLocalizedPage('/prices/')).toBeTrue();
      expect(isLocalizedPage('/blog/')).toBeTrue();
      expect(isLocalizedPage('/blog/what-is-3d-printing/')).toBeFalse();
    });

    it('localizes a Bulgarian path, keeping its trailing-slash style', () => {
      expect(localizePath('/prices', 'en')).toBe('/en/prices');
      expect(localizePath('/prices/', 'en')).toBe('/en/prices/');
      expect(localizePath('/', 'en')).toBe('/en/');
      expect(localizePath('/prices', 'bg')).toBe('/prices');
      expect(localizePath('/blog', 'en')).toBe('/en/blog');
      // A post is not a localized page: its translation has its own slug (blogPostPath).
      expect(localizePath('/blog/what-is-3d-printing', 'en')).toBe('/blog/what-is-3d-printing');
    });

    it('pairs every language version of a page, with Bulgarian as x-default', () => {
      const origin = 'https://3dpechat.bg';
      const expected = [
        { hreflang: 'bg', href: `${origin}/prices/` },
        { hreflang: 'en', href: `${origin}/en/prices/` },
        { hreflang: 'x-default', href: `${origin}/prices/` }
      ];
      expect(languageAlternates('/prices/', origin)).toEqual(expected);
      expect(languageAlternates('/en/prices/', origin)).toEqual(expected);
      expect(languageAlternates('/en/', origin).map(a => a.href))
        .toEqual([`${origin}/`, `${origin}/en/`, `${origin}/`]);
      // A Bulgarian-only post has no versions; a translated one pairs with them.
      expect(languageAlternates('/blog/what-is-3d-printing/', origin)).toEqual([]);
      const pla = [
        { hreflang: 'bg', href: `${origin}/blog/pla-pla-pla-pro-i-pln-razliki-i-izbor/` },
        { hreflang: 'en', href: `${origin}/en/blog/pla-vs-pla-plus-vs-pla-pro-vs-pln/` },
        { hreflang: 'x-default', href: `${origin}/blog/pla-pla-pla-pro-i-pln-razliki-i-izbor/` }
      ];
      expect(languageAlternates('/blog/pla-pla-pla-pro-i-pln-razliki-i-izbor/', origin)).toEqual(pla);
      expect(languageAlternates('/en/blog/pla-vs-pla-plus-vs-pla-pro-vs-pln/', origin)).toEqual(pla);
    });

    it('sends the switcher to the same page in the other language, or that language’s home page', () => {
      expect(switchLocaleUrl('/prices/', 'en')).toBe('/en/prices/');
      expect(switchLocaleUrl('/en/prices/', 'bg')).toBe('/prices/');
      expect(switchLocaleUrl('/en/', 'bg')).toBe('/');
      expect(switchLocaleUrl('/', 'en')).toBe('/en/');
      // A product anchor survives the switch.
      expect(switchLocaleUrl('/products/#variant-1', 'en')).toBe('/en/products/#variant-1');
      // A post goes to its translation; one without goes to that language's blog.
      expect(switchLocaleUrl('/blog/pla-pla-pla-pro-i-pln-razliki-i-izbor/', 'en')).toBe('/en/blog/pla-vs-pla-plus-vs-pla-pro-vs-pln/');
      expect(switchLocaleUrl('/en/blog/pla-vs-pla-plus-vs-pla-pro-vs-pln/#storage', 'bg')).toBe('/blog/pla-pla-pla-pro-i-pln-razliki-i-izbor/');
      expect(switchLocaleUrl('/blog/what-is-3d-printing/', 'en')).toBe('/en/blog/');
      expect(switchLocaleUrl('/blog/', 'en')).toBe('/en/blog/');
      expect(switchLocaleUrl('/en/blog/', 'bg')).toBe('/blog/');
      expect(switchLocaleUrl('/en/unknown/', 'bg')).toBe('/');
    });
  });

  describe('translated blog posts (locales.json translatedPosts)', () => {
    it('finds a post’s URL in every language it exists in', () => {
      expect(blogPostPath('pla-pla-pla-pro-i-pln-razliki-i-izbor', 'bg')).toBe('/blog/pla-pla-pla-pro-i-pln-razliki-i-izbor/');
      expect(blogPostPath('pla-pla-pla-pro-i-pln-razliki-i-izbor', 'en')).toBe('/en/blog/pla-vs-pla-plus-vs-pla-pro-vs-pln/');
      expect(blogPostPath('what-is-3d-printing', 'en')).toBeNull();
      expect(blogPostLocales('pla-pla-pla-pro-i-pln-razliki-i-izbor')).toEqual(['bg', 'en']);
      expect(blogPostLocales('what-is-3d-printing')).toEqual(['bg']);
    });

    it('tells which post a URL shows, by its Bulgarian slug', () => {
      expect(blogPostAt('/blog/what-is-3d-printing/')).toEqual({ locale: 'bg', source: 'what-is-3d-printing' });
      expect(blogPostAt('/en/blog/pla-vs-pla-plus-vs-pla-pro-vs-pln')).toEqual({ locale: 'en', source: 'pla-pla-pla-pro-i-pln-razliki-i-izbor' });
      expect(blogPostAt('/en/blog/unknown/')).toBeNull();
      expect(blogPostAt('/blog/')).toBeNull();
      expect(blogPostAt('/prices/')).toBeNull();
    });

    it('maps every translation to a post of its own, both ways', () => {
      for (const { code } of TRANSLATED_LOCALES) {
        for (const [source, slug] of Object.entries(TRANSLATED_POSTS[code] ?? {})) {
          expect(blogPostAt(`/${code}/blog/${slug}/`)).withContext(slug).toEqual({ locale: code, source });
        }
      }
    });
  });
});
