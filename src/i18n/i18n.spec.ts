import { coreMessages } from './bg';
import home from './bg/home.json';
import portfolio from './bg/portfolio.json';
import products from './bg/products.json';
import prices from './bg/prices.json';
import contact from './bg/contact.json';
import english from './en';
import business from '../data/business.json';
import faqData from '../data/faq.json';
import productsData from '../data/products.json';
import videosData from '../data/videos.json';
import registry from './locales.json';
import type { LocaleBundle } from '../app/i18n/i18n.types';

/**
 * The translation contract (src/i18n/README.md). Bulgarian is the source; every
 * other language must mirror it exactly, state only business.json facts and
 * translate all of the catalogue. Add a new language's bundle to BUNDLES.
 */
const BUNDLES: Record<string, LocaleBundle> = { en: english };

/** All Bulgarian messages: the core namespaces plus every page's own file. */
const bulgarian = { ...coreMessages, home, portfolio, products, prices, contact };

/** 'a.b.c' → string for every leaf. */
function leaves(tree: object, prefix = '', out = new Map<string, string>()): Map<string, string> {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out.set(path, value);
    else if (value && typeof value === 'object') leaves(value, path, out);
  }
  return out;
}

const placeholders = (text: string): string[] => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();

/** Numbers in a text, decimal comma normalised: „0,80“ and "0.80" are the same fact. */
const numbersIn = (text: string): string[] => (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map(n => n.replace(',', '.'));

/** Every number business.json states, in its facts or its structured fields. */
const factNumbers = new Set(numbersIn(`${business.facts.join(' ')} ${JSON.stringify(business)}`));

describe('translations (src/i18n)', () => {
  it('registers every bundle tested here in locales.json, and vice versa', () => {
    const others = registry.locales.map(l => l.code).filter(c => c !== registry.defaultLocale);
    expect(Object.keys(BUNDLES).sort()).toEqual(others.sort());
  });

  const source = leaves(bulgarian);

  it('has no empty Bulgarian strings', () => {
    for (const [key, text] of source) {
      expect(text.trim().length).withContext(key).toBeGreaterThan(0);
    }
  });

  for (const [code, bundle] of Object.entries(BUNDLES)) {
    describe(code, () => {
      const translated = leaves(bundle.messages);

      it('has exactly the Bulgarian keys — none missing, none extra', () => {
        const missing = [...source.keys()].filter(k => !translated.has(k));
        const extra = [...translated.keys()].filter(k => !source.has(k));
        expect(missing).withContext('missing keys').toEqual([]);
        expect(extra).withContext('keys Bulgarian does not have').toEqual([]);
      });

      it('keeps every {placeholder} of the Bulgarian message', () => {
        for (const [key, text] of source) {
          const other = translated.get(key);
          if (other !== undefined) {
            expect(placeholders(other)).withContext(key).toEqual(placeholders(text));
          }
        }
      });

      it('has no empty strings', () => {
        for (const [key, text] of translated) {
          expect(text.trim().length).withContext(key).toBeGreaterThan(0);
        }
      });

      it('never types a euro amount or an hour count by hand (they come from business.json)', () => {
        for (const [key, text] of translated) {
          expect(text).withContext(key).not.toMatch(/€\s?\d|\d\s?€/);
          expect(text).withContext(key).not.toMatch(/\d+\s?(?:hours?|h)\b/i);
        }
      });

      it('never offers what the business does not do (business.json neverClaim)', () => {
        const all = [...translated.values(), ...bundle.faq.map(f => f.answer)].join('\n');
        expect(all).not.toMatch(/\bSLA\b|\bSLS\b|\bMJF\b|resin|scanning|3D scan|same[- ]day/i);
        // Invoices may only be mentioned to say we don't issue them.
        for (const text of [...translated.values(), ...bundle.faq.map(f => f.answer)]) {
          if (/invoice/i.test(text)) {
            expect(text).toMatch(/don['’]t issue invoices|do not issue invoices/i);
          }
        }
      });

      describe('FAQ', () => {
        it('has every Bulgarian question, same ids, icons and order', () => {
          expect(bundle.faq.map(f => f.id)).toEqual(faqData.map(f => f.id));
          expect(bundle.faq.map(f => f.icon)).toEqual(faqData.map(f => f.icon));
          for (const f of bundle.faq) {
            expect(f.question.trim().endsWith('?')).withContext(f.id).toBeTrue();
            expect(f.answer.trim().length).withContext(f.id).toBeGreaterThan(20);
          }
        });

        it('uses no number that business.json does not state', () => {
          for (const f of bundle.faq) {
            const unknown = numbersIn(f.answer).filter(n => !factNumbers.has(n));
            expect(unknown).withContext(`${f.id}: ${f.answer}`).toEqual([]);
          }
        });
      });

      describe('catalogue (content/products.json)', () => {
        it('only has copy for products that exist', () => {
          const linkIds = new Set(productsData.map(p => p.linkId));
          const stray = Object.keys(bundle.products).filter(id => !linkIds.has(id));
          expect(stray).withContext('linkIds not in src/data/products.json').toEqual([]);
        });

        // A product added from the phone (issue form → PR) arrives in Bulgarian
        // only; until it is translated, its card shows the Bulgarian copy marked
        // lang="bg". Reported as pending — visible in the run, not a failure.
        it('translates every product', () => {
          const missing = productsData.map(p => p.linkId).filter(id => !bundle.products[id]);
          if (missing.length) {
            pending(`${code}: no copy yet for ${missing.join(', ')} — add it to src/i18n/${code}/content/products.json`);
          }
          expect(missing).toEqual([]);
        });

        it('mirrors each product’s structure: personalisation list, read-more and links', () => {
          for (const product of productsData) {
            const copy = bundle.products[product.linkId];
            if (!copy) continue;
            expect(copy.name.trim().length).withContext(product.linkId).toBeGreaterThan(0);
            expect(copy.description.trim().length).withContext(product.linkId).toBeGreaterThan(0);
            const custom = 'customContent' in product ? product.customContent : undefined;
            expect(copy.customContent?.items.length).withContext(`${product.linkId} customContent`)
              .toBe(custom?.items.length);
            const readMore = 'readMore' in product ? product.readMore : undefined;
            expect(!!copy.readMore).withContext(`${product.linkId} readMore`).toBe(!!readMore);
            const links = 'links' in product ? product.links : undefined;
            expect(copy.links?.length ?? 0).withContext(`${product.linkId} links`).toBe(links?.length ?? 0);
          }
        });
      });

      it('only has copy for videos that exist (content/videos.json)', () => {
        const slugs = new Set(videosData.videos.map(v => v.slug));
        for (const slug of Object.keys(bundle.videos)) {
          expect(slugs.has(slug)).withContext(slug).toBeTrue();
        }
      });
    });
  }
});
