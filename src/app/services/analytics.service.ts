import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, inject } from '@angular/core';

import { Locale, splitLocalePath } from '../i18n/locales';
import { ConsentService } from './consent.service';

export type ContactMethod = 'phone' | 'viber' | 'email';
export type LeadSource = 'contact_form' | 'product_order' | 'price_calculator' | 'bookmark_order';
export type SearchType = 'blog' | 'blog_tag';

/**
 * The GA4 events this site sends besides the automatic page views, with their
 * parameters. These names are what the GA reports, key events and custom
 * dimensions are set up on — rename one only together with GA
 * (AI_INSTRUCTIONS.md § Analytics).
 *
 * `cta_location` says where on the page it happened: the nearest
 * `data-analytics-area` around the link (navbar, menu, footer, home_hero, …),
 * else `content`.
 */
export interface AnalyticsEvents {
  /** A link or button that opens the contact page to ask for an offer. */
  quote_click: { cta_location: string };
  /** A tap on the phone number, Viber or the e-mail address. */
  contact_click: { method: ContactMethod; cta_location: string };
  /** A product card's „Поръчайте сега“ / "Order now". */
  order_click: { product_id: string; product_name: string };
  /** The contact form was sent (Web3Forms accepted it). GA4 recommended event. */
  generate_lead: { lead_source: LeadSource };
  /**
   * The visitor switched the page's language. Not `language`: gtag takes that
   * name as its own browser-language field (`ul`), so it never reaches GA as a
   * parameter — the same goes for page_location, page_title, page_referrer…
   */
  select_language: { selected_language: Locale; previous_language: Locale; cta_location: string };
  /** A blog search, sent once the visitor stops typing, or a tag click. GA4 recommended event. */
  search: { search_term: string; search_type: SearchType; result_count: number };
}

/** How long the visitor must stop typing before a search counts. */
export const SEARCH_PAUSE_MS = 1500;

/** GA4's global from index.html; absent during prerender and in unit tests. */
type Gtag = (command: 'event', name: string, params: object) => void;

const CONTACT_SCHEMES: readonly [RegExp, ContactMethod][] = [
  [/^tel:/i, 'phone'],
  [/^viber:/i, 'viber'],
  [/^mailto:/i, 'email']
];

/**
 * The one way the site sends GA4 events. Every call is a no-op until the
 * visitor accepted analytics in the consent card (ConsentService), and where
 * there is no `gtag` (prerender, unit tests, blocked by the visitor), so
 * callers never check.
 *
 * Links are tracked in one place, by trackLinks(): a click on any tel:, viber:
 * or mailto: link is a `contact_click` and a click on any link to the contact
 * page a `quote_click`, wherever the link is — the shell, a page, or a blog
 * post's markdown — so a new link needs no code. Buttons and other actions
 * call track() themselves.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);
  private readonly consent = inject(ConsentService);

  private linksTracked = false;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSearch = '';

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
    });
  }

  track<K extends keyof AnalyticsEvents>(name: K, params: AnalyticsEvents[K]): void {
    if (!this.browser || !this.consent.granted()) {
      return;
    }
    const gtag = (this.document.defaultView as { gtag?: Gtag } | null)?.gtag;
    if (typeof gtag !== 'function') {
      return;
    }
    try {
      gtag('event', name, params);
    } catch {
      // Analytics must never break the page.
    }
  }

  /**
   * A search for `term`, which had `resultCount` results. Typed searches are
   * sent once the visitor stops typing for SEARCH_PAUSE_MS (so „pla“ isn't
   * also counted as „p“ and „pl“); `immediate` sends at once (a tag click).
   * Terms under two characters and a repeat of the last one sent are skipped.
   */
  search(term: string, resultCount: number, type: SearchType, immediate = false): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
    const searchTerm = term.trim().toLowerCase();
    if (searchTerm.length < 2) {
      return;
    }
    const send = () => {
      this.searchTimer = null;
      const key = `${type}:${searchTerm}`;
      if (key === this.lastSearch) {
        return;
      }
      this.lastSearch = key;
      this.track('search', { search_term: searchTerm, search_type: type, result_count: resultCount });
    };
    if (immediate) {
      send();
    } else {
      this.searchTimer = setTimeout(send, SEARCH_PAUSE_MS);
    }
  }

  /** Starts the site-wide link tracking described above. Call once, from the app shell. */
  trackLinks(): void {
    if (!this.browser || this.linksTracked) {
      return;
    }
    this.linksTracked = true;
    // Capture phase: runs before RouterLink's own handler, and even if a
    // handler on the way stops the click from bubbling.
    const listener = (event: Event) => this.onClick(event);
    this.document.addEventListener('click', listener, true);
    this.destroyRef.onDestroy(() => this.document.removeEventListener('click', listener, true));
  }

  private onClick(event: Event): void {
    const target = event.target as Element | null;
    const link = target?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!link) {
      return;
    }
    const cta_location = link.closest('[data-analytics-area]')?.getAttribute('data-analytics-area') || 'content';
    const href = link.getAttribute('href') ?? '';
    const method = CONTACT_SCHEMES.find(([scheme]) => scheme.test(href))?.[1];
    if (method) {
      this.track('contact_click', { method, cta_location });
    } else if (this.isContactPage(link)) {
      this.track('quote_click', { cta_location });
    }
  }

  /** True for a link to the contact page in any language (/contact/, /en/contact/). */
  private isContactPage(link: HTMLAnchorElement): boolean {
    try {
      const url = new URL(link.href, this.document.baseURI);
      const origin = this.document.defaultView?.location.origin;
      return url.origin === origin && splitLocalePath(url.pathname).path.replace(/\/+$/, '') === '/contact';
    } catch {
      return false;
    }
  }
}
