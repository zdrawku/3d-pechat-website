export interface BlogPost {
  id: string;
  title: string;
  /** Full <title> when it must differ from `<title> | <brand>` (e.g. to keep it short). */
  seoTitle?: string;
  description: string;
  slug: string;
  route: string;
  /** Publish date. */
  date: Date;
  /** Last substantive content edit (sitemap <lastmod>, schema dateModified). Defaults to `date`. */
  dateModified?: Date;
  imageUrl?: string;
  tags?: string[];
  /** SEO meta keywords (distinct from the display `tags`). */
  keywords?: string[];
  author?: string;
  /** Caption of a video clip the post shows at its `<!-- video -->` marker (see ARTICLE_EXTRAS). */
  videoCaption?: string;
  /**
   * Only on a translation (localized-content.ts translateBlogPost()): the
   * Bulgarian post's slug, which keys its text, related content and SEO.
   */
  source?: string;
}
