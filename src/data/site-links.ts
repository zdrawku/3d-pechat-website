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

/**
 * Public Google Maps profile — "see all reviews" destination.
 *
 * The trailing `!9m1!1b1` in the data segment is what makes Maps open straight
 * on the **reviews** tab rather than the place overview, so keep it if this URL
 * is ever regenerated. The `entry=` / `g_ep=` query params Google appends when
 * you copy from the address bar are per-session build tokens and are dropped
 * deliberately — they add nothing and go stale.
 */
export const GOOGLE_MAPS_PROFILE_URL =
  'https://www.google.com/maps/place/3dpechat/@42.640588,23.3342435,554m/data=!3m1!1e3!4m8!3m7!1s0x40aa8563a6769d67:0x88d6c4d6579a104b!8m2!3d42.640588!4d23.3342435!9m1!1b1!16s%2Fg%2F11zcr3g4my';

/**
 * YouTube channel „3D Печат Услуги". Note the handle is `@3dpechatbg` with **no
 * dot** — unlike Instagram/TikTok (`3dpechat.bg`). YouTube handles can't contain
 * a dot, so don't "fix" it to match the others.
 *
 * Channel ID `UCe-6sDdk9n6nORVaUIjvsRQ` (stable even if the handle is renamed).
 */
export const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@3dpechatbg';

/**
 * Same channel, but YouTube opens the "Subscribe?" confirmation straight away.
 * Use it for explicit „Абонирай се" CTAs; use {@link YOUTUBE_CHANNEL_URL} for
 * plain "visit the channel" icon links.
 */
export const YOUTUBE_SUBSCRIBE_URL = 'https://www.youtube.com/@3dpechatbg?sub_confirmation=1';
