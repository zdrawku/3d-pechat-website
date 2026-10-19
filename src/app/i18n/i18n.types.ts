import type { CoreMessages, Messages, PageMessages, PageNamespace } from '../../i18n/bg';

export type { PageMessages, PageNamespace };

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
  /** Label of the „Прочети повече“ link (to the article's translation when there is one, else the Bulgarian article). */
  readMore?: string;
  /** Labels of the product's `links`, in the same order. */
  links?: string[];
}

/** UI copy for a video (src/i18n/<lang>/content/videos.json, keyed by `slug`). The video itself is not translated. */
export interface VideoCopy {
  title?: string;
  posterAlt?: string;
}

/** An FAQ entry's copy in one language (src/i18n/<lang>/content/faq.json, keyed by the entry's `id`). */
export interface FaqCopy {
  question: string;
  answer: string;
}

/**
 * A translated blog post's copy and dates (src/i18n/<lang>/content/blog.json,
 * keyed by the Bulgarian slug). Its slug is in src/i18n/locales.json
 * (`translatedPosts`), its text in src/assets/blogs/<lang>/<slug>.md; the cover
 * image and author come from the Bulgarian post in blog-posts.registry.ts.
 */
export interface BlogPostCopy {
  title: string;
  /** Full <title> when `<title> | <brand>` would be too long. */
  seoTitle?: string;
  description: string;
  tags: string[];
  keywords: string[];
  /** When this translation was published (YYYY-MM-DD) — not the Bulgarian post's date. */
  date: string;
  /** Its last substantive edit (YYYY-MM-DD): sitemap <lastmod>, schema dateModified. Bump by hand. */
  dateModified: string;
  /** Caption of a video clip the post shows at its `<!-- video -->` marker. */
  videoCaption?: string;
}

/**
 * A language's copy of the content in src/data/, keyed by each item's id.
 * Everything else (order, icons, images, links) always comes from src/data/,
 * via faqFor(), localizeGallery(), localizeProduct() and localizeVideo().
 * Bulgarian is the source: its content IS src/data/, so its overlays are empty.
 */
export interface LocaleContent {
  /** Translated blog posts, keyed by the Bulgarian slug (src/i18n/<lang>/content/blog.json). */
  blog: Record<string, BlogPostCopy>;
  faq: Record<string, FaqCopy>;
  /** Gallery images' alt text (src/i18n/<lang>/content/gallery.json, keyed by the image's `src`). */
  gallery: Record<string, string>;
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
