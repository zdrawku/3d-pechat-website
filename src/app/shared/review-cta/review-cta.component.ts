import { Component, OnDestroy, OnInit, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { IgxButtonDirective, IgxSnackbarComponent } from 'igniteui-angular';

import { GOOGLE_REVIEW_URL } from '../../../data/site-links';

/** localStorage key holding the epoch-ms timestamp of the last time we asked. */
const STORAGE_KEY = 'reviewCtaDismissedAt';

/** How long the snackbar stays silent after a dismissal or a click (30 days). */
const COOL_DOWN_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Number of in-session route navigations before the ask appears. The visitor
 * lands on page 1 and navigates to page 2 — that second navigation is the
 * engagement signal (a first-time bouncer never triggers it).
 */
const NAVIGATIONS_BEFORE_ASK = 2;

/** Small delay after the triggering navigation so the ask never fights the page render. */
const SHOW_DELAY_MS = 2500;

/**
 * Layer 3 of the review CTA (Idea 4): a one-time, dismissible snackbar shown to
 * *engaged* visitors only — never a modal and never an interstitial, both to
 * avoid annoying people and to stay clear of Google's mobile intrusive-
 * interstitial SEO penalty.
 *
 * Rules, all deliberate:
 * - appears only after {@link NAVIGATIONS_BEFORE_ASK} route navigations in the session;
 * - clicking through *or* dismissing writes a timestamp to localStorage, which
 *   silences it for {@link COOL_DOWN_MS} (~30 days) — nobody is asked twice a month;
 * - fully browser-guarded, so SSR prerender never emits it into the static HTML.
 *
 * Copy asks for an honest opinion, not a good rating: soliciting *positive*
 * reviews ("give us 5 stars") violates Google's review policy.
 */
@Component({
  selector: 'app-review-cta',
  imports: [IgxSnackbarComponent, IgxButtonDirective],
  templateUrl: './review-cta.component.html',
  styleUrls: ['./review-cta.component.scss']
})
export class ReviewCtaComponent implements OnInit, OnDestroy {
  // Not `static: true` — the snackbar lives inside an @if (isBrowser) block, so
  // it does not exist at construction time (and never exists during prerender).
  @ViewChild('reviewSnackbar') public snackbar?: IgxSnackbarComponent;

  public readonly googleReviewUrl = GOOGLE_REVIEW_URL;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  /** Gates the template: nothing is rendered during SSR prerender. */
  public readonly isBrowser = isPlatformBrowser(this.platformId);

  private navigations = 0;
  private routerSub?: Subscription;
  private showHandle: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    // Router events / localStorage / timers are browser-only — during prerender
    // this component renders nothing at all.
    if (!this.isBrowser || this.isInCoolDown()) {
      return;
    }

    this.routerSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.onNavigated());
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.clearShowTimer();
  }

  /** "Остави ревю" — opens Google's review form and silences the ask for 30 days. */
  public onAction(): void {
    this.remember();
    this.snackbar?.close();
    window.open(this.googleReviewUrl, '_blank', 'noopener,noreferrer');
  }

  /** "✕" — no thanks; also silences the ask for 30 days. */
  public onDismiss(): void {
    this.remember();
    this.snackbar?.close();
  }

  private onNavigated(): void {
    this.navigations++;
    if (this.navigations < NAVIGATIONS_BEFORE_ASK) {
      return;
    }

    // The engagement threshold is reached only once per session.
    this.routerSub?.unsubscribe();
    this.showHandle = setTimeout(() => {
      this.showHandle = null;
      this.snackbar?.open();
    }, SHOW_DELAY_MS);
  }

  private isInCoolDown(): boolean {
    const stored = this.readStorage(STORAGE_KEY);
    if (!stored) {
      return false;
    }
    const askedAt = Number(stored);
    // A corrupt/hand-edited value shouldn't permanently disable the CTA.
    if (!Number.isFinite(askedAt)) {
      return false;
    }
    return Date.now() - askedAt < COOL_DOWN_MS;
  }

  private remember(): void {
    // Private-mode/blocked storage must not break the CTA — worst case the
    // visitor is asked again in a later session.
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* storage unavailable — ignore */
    }
  }

  private readStorage(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private clearShowTimer(): void {
    if (this.showHandle !== null) {
      clearTimeout(this.showHandle);
      this.showHandle = null;
    }
  }
}
