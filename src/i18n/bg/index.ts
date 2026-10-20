/**
 * Bulgarian — the SOURCE language of the site's UI strings.
 *
 * `Messages` (core + page namespaces) is the type every other language must
 * satisfy: a language whose files miss a key fails `ng build`, and
 * src/i18n/i18n.spec.ts also rejects extra keys and mismatched `{placeholders}`.
 * The translation keys used in templates (`'home.hero.title' | t`) are derived
 * from it too, so a typo in a key is a compile error (strictTemplates).
 *
 * Loading (bundle size): the core namespaces below are used on every page and
 * ship in the main bundle. Each page namespace (home, portfolio, products,
 * prices, contact, blog, privacy, terms) is imported by its own page component, which registers it
 * with I18nService — so a page's Bulgarian text stays in that page's lazy chunk,
 * as it was before localization. Other languages are one lazy chunk each
 * (src/app/i18n/locales.ts).
 */
import common from './common.json';
import shell from './shell.json';
import seo from './seo.json';
import faq from './faq.json';
import reviews from './reviews.json';
import misc from './misc.json';
import type home from './home.json';
import type portfolio from './portfolio.json';
import type products from './products.json';
import type prices from './prices.json';
import type contact from './contact.json';
import type blog from './blog.json';
import type privacy from './privacy.json';
import type terms from './terms.json';

/** Strings used on every page: the shell, page meta, FAQ heading, reviews, video and errors. */
export const coreMessages = { common, shell, seo, faq, reviews, misc };

export type CoreMessages = typeof coreMessages;

/** One page's strings; each page component registers its own (see above). */
export interface PageMessages {
  home: typeof home;
  portfolio: typeof portfolio;
  products: typeof products;
  prices: typeof prices;
  contact: typeof contact;
  blog: typeof blog;
  privacy: typeof privacy;
  terms: typeof terms;
}

export type PageNamespace = keyof PageMessages;

export type Messages = CoreMessages & PageMessages;
