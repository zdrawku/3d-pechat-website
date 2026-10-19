/**
 * English. Mirrors src/i18n/bg/ file for file and key for key; `satisfies
 * LocaleBundle` makes a missing key a build error, and src/i18n/i18n.spec.ts
 * catches extra keys, mismatched {placeholders} and untranslated content.
 * Loaded as its own lazy chunk (src/app/i18n/locales.ts), never in the main bundle.
 */
import type { LocaleBundle } from '../../app/i18n/i18n.types';
import common from './common.json';
import shell from './shell.json';
import seo from './seo.json';
import home from './home.json';
import portfolio from './portfolio.json';
import productsUi from './products.json';
import prices from './prices.json';
import faqUi from './faq.json';
import contact from './contact.json';
import reviews from './reviews.json';
import misc from './misc.json';
import faq from './content/faq.json';
import gallery from './content/gallery.json';
import products from './content/products.json';
import videos from './content/videos.json';

const english = {
  messages: { common, shell, seo, home, portfolio, products: productsUi, prices, faq: faqUi, contact, reviews, misc },
  faq,
  gallery,
  products,
  videos
} satisfies LocaleBundle;

export default english;
