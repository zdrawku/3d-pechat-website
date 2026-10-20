import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

/**
 * Where the visitor's answer is kept: localStorage, as
 * `{"analytics":"granted"|"denied","at":<epoch ms>}`. The inline Google tag
 * script in index.html and 404.html reads the same key, format and age to load
 * Google Analytics for a visitor who already accepted — change all three
 * together.
 */
export const CONSENT_STORAGE_KEY = 'consent';

/** An answer is kept for 6 months (182 days); then the card asks again. */
export const CONSENT_MAX_AGE_MS = 182 * 24 * 60 * 60 * 1000;

export type ConsentChoice = 'granted' | 'denied';

interface StoredConsent {
  analytics: ConsentChoice;
  at: number;
}

/** Defined by the inline Google tag script in index.html; absent in prerender and unit tests. */
interface ConsentWindow {
  grantAnalytics?: () => void;
  gtag?: (...args: unknown[]) => void;
}

/**
 * The visitor's cookie consent (approved design „B“, artifact "Cookie Consent
 * Variants"). Google Analytics is the only thing on the site that needs it, so
 * there is one question. Consent Mode v2 runs in basic mode: every visitor
 * starts with all four signals denied and nothing from Google loads until they
 * accept (`grantAnalytics()` in index.html).
 *
 * The consent card (ConsentBannerComponent) shows while there is no answer, or
 * after the footer's „Бисквитки“ button reopened it.
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  /** The answer for analytics; null while there is none (or it is older than 6 months). */
  readonly analytics = signal<ConsentChoice | null>(this.read());
  private readonly reopened = signal(false);

  /** Whether the consent card shows. Never during prerender, so the static HTML doesn't carry it. */
  readonly visible = computed(() => this.browser && (this.analytics() === null || this.reopened()));

  granted(): boolean {
    return this.analytics() === 'granted';
  }

  answered(): boolean {
    return this.analytics() !== null;
  }

  /** „Приемам“: remembers the answer and loads Google Analytics. */
  accept(): void {
    this.save('granted');
    this.window()?.grantAnalytics?.();
  }

  /** „Отказвам“: remembers the answer; withdrawing an earlier yes also stops GA and deletes its cookies. */
  decline(): void {
    const withdrawn = this.granted();
    this.save('denied');
    if (withdrawn) {
      this.window()?.gtag?.('consent', 'update', { analytics_storage: 'denied' });
      this.deleteAnalyticsCookies();
    }
  }

  /** The footer's „Бисквитки“ button: shows the card again so the answer can be changed. */
  reopen(): void {
    this.reopened.set(true);
  }

  private save(choice: ConsentChoice): void {
    this.analytics.set(choice);
    this.reopened.set(false);
    try {
      const stored: StoredConsent = { analytics: choice, at: Date.now() };
      this.window()?.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Storage blocked: the answer holds for this page only.
    }
  }

  private read(): ConsentChoice | null {
    if (!this.browser) {
      return null;
    }
    try {
      const stored = JSON.parse(this.window()?.localStorage.getItem(CONSENT_STORAGE_KEY) ?? 'null') as Partial<StoredConsent> | null;
      const fresh = typeof stored?.at === 'number' && Date.now() - stored.at < CONSENT_MAX_AGE_MS;
      return fresh && (stored.analytics === 'granted' || stored.analytics === 'denied') ? stored.analytics : null;
    } catch {
      return null;
    }
  }

  /**
   * GA4's `_ga` and `_ga_<id>` cookies, set on the site's domain. Deleted for
   * every domain spelling GA may have used, since a cookie only goes away when
   * the domain matches.
   */
  private deleteAnalyticsCookies(): void {
    const host = this.document.location?.hostname ?? '';
    const domains = new Set(['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`]);
    for (const cookie of this.document.cookie.split(';')) {
      const name = cookie.split('=')[0].trim();
      if (!name.startsWith('_ga')) {
        continue;
      }
      for (const domain of domains) {
        this.document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
      }
    }
  }

  private window(): (Window & ConsentWindow) | null {
    return this.browser ? (this.document.defaultView as (Window & ConsentWindow) | null) : null;
  }
}
