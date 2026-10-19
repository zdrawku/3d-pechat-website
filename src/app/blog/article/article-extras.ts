import { MAKERWORLD_COIN_CARD_URL } from '../../../data/site-links';

/** What a post shows besides its text, in every language. */
export interface ArticleExtras {
  /** A player at the `<!-- video -->` marker: the featured YouTube video, or a clip from src/assets (caption: the post's `videoCaption`). */
  video?: 'featured' | { src: string; poster: string };
  /** Buttons under the article: catalogue + contact, and for 'video' the YouTube subscribe link too. */
  cta?: 'products' | 'video';
  /** The model link filled into the post's `<!-- makerworld -->` section. */
  makerWorldUrl?: string;
}

/**
 * Extras per post, by Bulgarian slug. A post that is only text — every
 * auto-generated one — needs no entry. Its FAQ needs none either: a
 * `<!-- faq -->` section in the text becomes FAQPage schema by itself.
 */
export const ARTICLE_EXTRAS: Readonly<Record<string, ArticleExtras>> = {
  '3d-pechat-po-porachka-sofia-video': { video: 'featured', cta: 'video' },
  'standstrap-3d-printiran-stoper-za-snoubord': {
    video: { src: 'assets/blogs/videos/standstrap-na-pistata.mp4', poster: 'assets/blogs/images/articles/standstrap-na-sneg.webp' }
  },
  'monetna-karta-bulgarski-evro-moneti': { cta: 'products', makerWorldUrl: MAKERWORLD_COIN_CARD_URL }
};
