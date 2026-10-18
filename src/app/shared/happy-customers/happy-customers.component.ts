import { Component, Input, computed, inject } from '@angular/core';
import {
  IGX_CARD_DIRECTIVES,
  IgxAvatarComponent,
  IgxButtonDirective,
  IgxIconComponent
} from 'igniteui-angular';

import { Review, ReviewsData } from '../../models/review.model';
import { GOOGLE_MAPS_PROFILE_URL, GOOGLE_REVIEW_URL } from '../../../data/site-links';
import reviewsData from '../../../data/reviews.json';
import { I18nService } from '../../i18n/i18n.service';
import { TranslatePipe } from '../../i18n/translate.pipe';

/**
 * Which face of the component to render:
 * - `section` — the full „Доволни клиенти" block (card grid on desktop,
 *   swipeable strip on mobile). Used on the main page.
 * - `bar` — the compact one-row trust bar. Used on the products page above the
 *   order CTAs, where a full section would compete with the product cards.
 */
export type HappyCustomersVariant = 'section' | 'bar';

/**
 * The language the reviews are written in. They are real customers' words, so
 * they are shown as written on every language's pages — marked with `lang` and
 * a one-line note instead of being translated.
 */
const REVIEWS_LANGUAGE = 'bg';

/** Colors for the generated initial circles — cycled by index, no avatar images. */
const AVATAR_COLORS = ['#7E57C2', '#26A69A', '#EF6C00', '#5C6BC0', '#00897B'];

/**
 * Idea 5 — „Доволни клиенти": hand-picked Google reviews from
 * `src/data/reviews.json`, prerendered into the HTML.
 *
 * One component, two faces (see {@link HappyCustomersVariant}), both fed by the
 * same data file. Every face closes the review loop with Idea 4 by linking to
 * the same direct write-review URL.
 *
 * ⚠️ Deliberately **no** schema.org `Review`/`AggregateRating` markup — Google
 * prohibits self-serving markup of reviews sourced from Google itself. This is
 * a display-only section; see `review.model.ts`.
 */
@Component({
  selector: 'app-happy-customers',
  imports: [IGX_CARD_DIRECTIVES, IgxAvatarComponent, IgxButtonDirective, IgxIconComponent, TranslatePipe],
  templateUrl: './happy-customers.component.html',
  styleUrls: ['./happy-customers.component.scss']
})
export class HappyCustomersComponent {
  @Input() variant: HappyCustomersVariant = 'section';

  private readonly i18n = inject(I18nService);

  public readonly googleReviewUrl = GOOGLE_REVIEW_URL;
  public readonly googleMapsUrl = GOOGLE_MAPS_PROFILE_URL;

  private readonly data = reviewsData as ReviewsData;

  /** Only `featured` entries are shown; array order in the JSON is display order. */
  public readonly reviews: Review[] = this.data.reviews.filter((review) => review.featured);

  public readonly totalCount = this.data.totalCount;
  public readonly averageRating = this.data.averageRating;

  /** `lang` for the quotes when the page is in another language than the reviews; null on Bulgarian pages. */
  protected readonly quoteLang = computed(() => (this.i18n.locale() === REVIEWS_LANGUAGE ? null : REVIEWS_LANGUAGE));

  /** The single quote shown in the compact trust bar — the first featured review. */
  public get leadReview(): Review | undefined {
    return this.reviews[0];
  }

  /** Average formatted for display, e.g. `5.0`. */
  public get averageRatingLabel(): string {
    return this.averageRating.toFixed(1);
  }

  /** „27 ревюта" / „1 ревю" — the language's plural form for the count. */
  public get reviewCountLabel(): string {
    return this.i18n.plural('reviews.count', this.totalCount);
  }

  /** Filled-star string for a rating, e.g. `★★★★★`. Decorative — see `ratingLabel()`. */
  public stars(rating: number): string {
    const filled = Math.max(0, Math.min(5, Math.round(rating)));
    return '★'.repeat(filled) + '☆'.repeat(5 - filled);
  }

  /** Accessible text for a star row, since the ★ glyphs are aria-hidden. */
  public ratingLabel(rating: number): string {
    return this.i18n.t('reviews.rating', { rating });
  }

  /** First letter of the author's name for the generated avatar circle. */
  public initial(author: string): string {
    return author.trim().charAt(0).toUpperCase();
  }

  /** Stable per-author color so a review keeps its circle color across renders. */
  public avatarColor(index: number): string {
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
  }

  /**
   * `2026-05` → `май 2026` / `May 2026` (month name from Intl in the page's
   * language). Falls back to the raw value for anything that isn't a
   * well-formed `YYYY-MM`, so a typo in the JSON degrades instead of breaking.
   */
  public formatDate(date: string): string {
    const match = /^(\d{4})-(\d{2})$/.exec(date);
    if (!match) {
      return date;
    }
    const month = Number(match[2]);
    if (month < 1 || month > 12) {
      return date;
    }
    return `${this.i18n.monthName(month)} ${match[1]}`;
  }
}
