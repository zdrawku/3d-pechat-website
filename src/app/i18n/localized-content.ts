import type { Product } from '../models/product.model';
import type { Video } from '../models/video.model';
import type { ProductCopy, VideoCopy } from './i18n.types';

/** A gallery image with its alt text in the page's language. */
export interface LocalizedImage {
  src: string;
  alt: string;
  /** `lang` of an alt text that is still Bulgarian on another language's page; null otherwise. */
  lang: string | null;
}

/**
 * Gallery images with their alt text from `copy` (keyed by `src`). An image
 * without copy keeps its Bulgarian alt, marked with `untranslatedLang`
 * (`I18nService.langIfForeign()`: 'bg' on other languages' pages, null on
 * Bulgarian ones). An empty alt stays empty: the template supplies a
 * translated fallback.
 */
export function localizeGallery(
  images: readonly { src: string; alt: string }[],
  copy: Record<string, string>,
  untranslatedLang: string | null
): LocalizedImage[] {
  return images.map(({ src, alt }) =>
    copy[src] ? { src, alt: copy[src], lang: null } : { src, alt, lang: alt ? untranslatedLang : null }
  );
}

/**
 * A product with its visible copy in another language. Everything that is not
 * copy (images, ids, links' URLs, dates) stays from src/data/products.json, so a
 * translation can never break an image or a link. No copy → the product as is.
 */
export function localizeProduct<T extends Product>(product: T, copy: ProductCopy | undefined): T {
  if (!copy) {
    return product;
  }
  return {
    ...product,
    name: copy.name,
    description: copy.description,
    tags: copy.tags ?? product.tags,
    customContent:
      product.customContent && copy.customContent
        ? { ...product.customContent, title: copy.customContent.title, items: copy.customContent.items }
        : product.customContent,
    readMore: product.readMore && copy.readMore ? { ...product.readMore, label: copy.readMore } : product.readMore,
    links: product.links?.map((link, i) => ({ ...link, label: copy.links?.[i] ?? link.label }))
  };
}

/** A video's UI copy (title for labels, poster alt) in another language; the video itself stays as is. */
export function localizeVideo(video: Video, copy: VideoCopy | undefined): Video {
  return copy ? { ...video, title: copy.title ?? video.title, posterAlt: copy.posterAlt ?? video.posterAlt } : video;
}
