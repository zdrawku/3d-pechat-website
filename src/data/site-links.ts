/**
 * Shared external links for the site. One place to change a URL that appears in
 * several components.
 */

/**
 * Direct "write a review" link for the 3dpechat.bg Google Business Profile.
 *
 * This opens Google's review dialog in one tap. Do **not** replace it with a
 * `google.com/search?q=…` URL — a search-results page makes the visitor hunt for
 * the business card, and on some devices/locales it never surfaces the review
 * form at all.
 *
 * Place ID `ChIJZ512pmOFqkARSxCaV9bE1og` = 3dpechat, бул. „Симеоновско шосе“
 * 110 б, 1700 София (from Google's Place ID finder, 2026-07-13).
 */
export const GOOGLE_REVIEW_URL =
  'https://search.google.com/local/writereview?placeid=ChIJZ512pmOFqkARSxCaV9bE1og';

/** Public Google Maps profile — "see all reviews" destination. */
export const GOOGLE_MAPS_PROFILE_URL =
  'https://www.google.com/maps/place/?q=place_id:ChIJZ512pmOFqkARSxCaV9bE1og';
