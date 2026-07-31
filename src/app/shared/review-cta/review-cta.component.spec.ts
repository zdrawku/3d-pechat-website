import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { NavigationEnd, Router } from '@angular/router';

import { ReviewCtaComponent } from './review-cta.component';
import { GOOGLE_REVIEW_URL } from '../../../data/site-links';

const STORAGE_KEY = 'reviewCtaDismissedAt';

describe('ReviewCtaComponent', () => {
  let component: ReviewCtaComponent;
  let fixture: ComponentFixture<ReviewCtaComponent>;
  let router: Router;

  /** Fires the NavigationEnd events the component counts as engagement. */
  function navigate(times: number): void {
    const events = router.events as unknown as { next: (e: NavigationEnd) => void };
    for (let i = 0; i < times; i++) {
      events.next(new NavigationEnd(i, `/page-${i}`, `/page-${i}`));
    }
  }

  beforeEach(async () => {
    localStorage.removeItem(STORAGE_KEY);

    await TestBed.configureTestingModule({
      imports: [ReviewCtaComponent, NoopAnimationsModule, RouterTestingModule]
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(ReviewCtaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the shared direct write-review link', () => {
    expect(component.googleReviewUrl).toBe(GOOGLE_REVIEW_URL);
  });

  it('stays hidden before the engagement threshold', fakeAsync(() => {
    navigate(1);
    tick(5000);
    expect(component.snackbar?.isVisible).toBeFalsy();
  }));

  it('opens after the second navigation', fakeAsync(() => {
    navigate(2);
    tick(5000);
    expect(component.snackbar?.isVisible).toBeTrue();
  }));

  it('records a timestamp when dismissed', () => {
    component.onDismiss();
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
  });

  it('does not arm itself while inside the 30-day cool-down', fakeAsync(() => {
    // Rebuild the component with a recent dismissal already stored.
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    const cooled = TestBed.createComponent(ReviewCtaComponent);
    cooled.detectChanges();

    navigate(3);
    tick(5000);
    expect(cooled.componentInstance.snackbar?.isVisible).toBeFalsy();
  }));

  it('arms again once the cool-down has expired', fakeAsync(() => {
    const thirtyOneDaysAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, String(thirtyOneDaysAgo));
    const expired = TestBed.createComponent(ReviewCtaComponent);
    expired.detectChanges();

    navigate(2);
    tick(5000);
    expect(expired.componentInstance.snackbar?.isVisible).toBeTrue();
  }));
});
