/**
 * A hand-curated customer review as stored in `src/data/reviews.json` (imported
 * at build time, same pattern as `products.json`).
 *
 * These are copied by hand from the Google Business Profile — deliberately a
 * curated hall of fame rather than a live feed, so no third-party widget script
 * and no Places API key are needed.
 *
 * ⚠️ These reviews are shown **visually only**. Do not add schema.org
 * `Review`/`AggregateRating` markup for them: Google prohibits self-serving
 * review markup sourced from third-party sites (including Google itself), and
 * doing so risks a manual action. The real stars already show on the Business
 * Profile in search results.
 */
export interface Review {
  /** Reviewer name as shown on the site, e.g. „Иван П." — keep it abbreviated. */
  author: string;
  /** 1–5 stars, as given on Google. */
  rating: number;
  /** `YYYY-MM` — month precision is enough and ages more gracefully than a day. */
  date: string;
  /** The review text, without surrounding quote marks (the UI adds them). */
  text: string;
  /** Optional deep link to the review on Google Maps. */
  sourceUrl?: string;
  /** `true` shows the review in the „Доволни клиенти" section on the site. */
  featured: boolean;
}

/** Shape of `src/data/reviews.json`. */
export interface ReviewsData {
  /**
   * Total number of Google reviews the business has, for the aggregate header
   * („5.0 от 27 ревюта"). Kept separate from `reviews.length` because only a
   * hand-picked subset is displayed.
   */
  totalCount: number;
  /** Overall rating on the Business Profile, e.g. `5`. */
  averageRating: number;
  /** Curated reviews. **Array order is display order.** */
  reviews: Review[];
}
