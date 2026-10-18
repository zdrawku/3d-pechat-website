import type { CoreMessages, Messages, PageMessages, PageNamespace } from '../../i18n/bg';
import type { FaqItem } from '../models/faq.model';

export type { CoreMessages, Messages, PageMessages, PageNamespace };

type Join<P extends string, K extends string> = P extends '' ? K : `${P}.${K}`;

/**
 * Every leaf of the Bulgarian messages as a dotted key ('home.hero.title').
 * The `t` pipe takes this type, so with strictTemplates a misspelled key in a
 * template is a build error rather than a raw key on the page.
 */
export type TranslationKey<T = Messages, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? Join<P, K> : TranslationKey<T[K], Join<P, K>>;
}[keyof T & string];

/**
 * Keys of plural groups — objects with an `other` form plus the forms the
 * language needs (`one` for Bulgarian and English; `few`/`many` for e.g.
 * Russian or Polish). `I18nService.plural()` picks the form via Intl.PluralRules.
 */
export type PluralKey<T = Messages, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? never
    : T[K] extends { other: string }
      ? Join<P, K>
      : PluralKey<T[K], Join<P, K>>;
}[keyof T & string];

/** Values for `{placeholders}` in a message. */
export type TranslationParams = Record<string, string | number>;

/** A product's visible copy in one language (src/i18n/<lang>/content/products.json, keyed by `linkId`). */
export interface ProductCopy {
  name: string;
  description: string;
  tags?: string[];
  customContent?: { title: string; items: string[] };
  /** Label of the „Прочети повече“ link (the article itself stays Bulgarian). */
  readMore?: string;
  /** Labels of the product's `links`, in the same order. */
  links?: string[];
}

/** UI copy for a video (src/i18n/<lang>/content/videos.json, keyed by `slug`). The video itself is not translated. */
export interface VideoCopy {
  title?: string;
  posterAlt?: string;
}

/**
 * A language's copy of the content in src/data/. Bulgarian is the source: its
 * content IS src/data/, so its overlays are empty and components fall back to
 * the data itself (see faqFor() and localizeProduct()).
 */
export interface LocaleContent {
  /** The FAQ in this language — same ids, icons and order as src/data/faq.json. Empty = Bulgarian. */
  faq: FaqItem[];
  products: Record<string, ProductCopy>;
  videos: Record<string, VideoCopy>;
}

/** Everything a translation provides (src/i18n/<lang>/index.ts): all messages plus its content. */
export interface LocaleBundle extends LocaleContent {
  messages: Messages;
}

/**
 * What the Bulgarian source ships up front: only the core namespaces. Each
 * page component registers its own Bulgarian page namespace (I18nService.registerPage).
 */
export interface SourceBundle extends LocaleContent {
  messages: CoreMessages;
}
