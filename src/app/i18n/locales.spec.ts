import registry from '../../i18n/locales.json';
import { PAGE_PATHS } from '../services/seo.service';
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALIZED_PAGES,
  isLocale,
  isLocalizedPage,
  languageAlternates,
  loadLocale,
  localeDefinition,
  localizePath,
  splitLocalePath,
  switchLocaleUrl
} from './locales';

describe('locales', () => {
  describe('registry (src/i18n/locales.json)', () => {
    it('lists Bulgarian first, as the default language', () => {
      expect(DEFAULT_LOCALE).toBe('bg');
      expect(LOCALES[0].code).toBe(DEFAULT_LOCALE);
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

    it('localises exactly the pages SeoService knows (PAGE_PATHS)', () => {
      expect([...LOCALIZED_PAGES].sort()).toEqual(Object.values(PAGE_PATHS).sort());
      for (const page of LOCALIZED_PAGES) {
        expect(page).withContext(page).toMatch(/^\/([a-z-]+\/)?$/);
      }
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
      expect(isLocalizedPage('/blog/')).toBeFalse();
      expect(isLocalizedPage('/blog/what-is-3d-printing/')).toBeFalse();
    });

    it('localizes a Bulgarian path, keeping its trailing-slash style', () => {
      expect(localizePath('/prices', 'en')).toBe('/en/prices');
      expect(localizePath('/prices/', 'en')).toBe('/en/prices/');
      expect(localizePath('/', 'en')).toBe('/en/');
      expect(localizePath('/prices', 'bg')).toBe('/prices');
      // Bulgarian-only pages stay Bulgarian.
      expect(localizePath('/blog', 'en')).toBe('/blog');
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
      expect(languageAlternates('/blog/what-is-3d-printing/', origin)).toEqual([]);
    });

    it('sends the switcher to the same page in the other language, or that language’s home page', () => {
      // Router URLs, slash-free: a trailing slash would parse as an empty
      // segment and match the 404 instead of the page.
      expect(switchLocaleUrl('/prices/', 'en')).toBe('/en/prices');
      expect(switchLocaleUrl('/en/prices/', 'bg')).toBe('/prices');
      expect(switchLocaleUrl('/en/', 'bg')).toBe('/');
      expect(switchLocaleUrl('/', 'en')).toBe('/en');
      // A product anchor survives the switch.
      expect(switchLocaleUrl('/products/#variant-1', 'en')).toBe('/en/products#variant-1');
      // A Bulgarian-only page has no English version: go to the English home page.
      expect(switchLocaleUrl('/blog/what-is-3d-printing/', 'en')).toBe('/en');
      expect(switchLocaleUrl('/en/unknown/', 'bg')).toBe('/');
    });
  });
});
