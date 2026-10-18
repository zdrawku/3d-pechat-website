import type { Product } from '../models/product.model';
import type { Video } from '../models/video.model';
import type { ProductCopy, VideoCopy } from './i18n.types';

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
