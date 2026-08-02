import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HappyCustomersComponent } from './happy-customers.component';
import { GOOGLE_MAPS_PROFILE_URL, GOOGLE_REVIEW_URL } from '../../../data/site-links';

describe('HappyCustomersComponent', () => {
  let component: HappyCustomersComponent;
  let fixture: ComponentFixture<HappyCustomersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HappyCustomersComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HappyCustomersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows only featured reviews from reviews.json', () => {
    expect(component.reviews.length).toBeGreaterThan(0);
    expect(component.reviews.every((review) => review.featured)).toBeTrue();
  });

  it('links to the shared Google URLs, closing the loop with the review CTA', () => {
    expect(component.googleReviewUrl).toBe(GOOGLE_REVIEW_URL);
    expect(component.googleMapsUrl).toBe(GOOGLE_MAPS_PROFILE_URL);
  });

  it('renders the card grid in the section variant', () => {
    const grid = fixture.nativeElement.querySelector('[data-testid="happy-customers-grid"]');
    expect(grid).toBeTruthy();
    expect(grid.querySelectorAll('.hc_card').length).toBe(component.reviews.length);
    expect(fixture.nativeElement.querySelector('[data-testid="happy-customers-bar"]')).toBeNull();
  });

  it('renders the compact trust bar in the bar variant', () => {
    component.variant = 'bar';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="happy-customers-bar"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="happy-customers-grid"]')).toBeNull();
  });

  // The whole site is built on Ignite UI; these guard against a future edit
  // quietly replacing the components with hand-rolled plain-HTML equivalents.
  it('builds the section from Ignite UI components', () => {
    const host = fixture.nativeElement;
    expect(host.querySelectorAll('igx-card').length).toBe(component.reviews.length);
    expect(host.querySelectorAll('igx-avatar').length).toBe(component.reviews.length);
    expect(host.querySelectorAll('igx-card-header').length).toBe(component.reviews.length);
    expect(host.querySelectorAll('igx-icon').length).toBeGreaterThan(0);
  });

  it('builds the trust bar from an Ignite card and button', () => {
    component.variant = 'bar';
    fixture.detectChanges();

    const bar = fixture.nativeElement.querySelector('[data-testid="happy-customers-bar"]');
    expect(bar.tagName.toLowerCase()).toBe('igx-card');
    const cta = fixture.nativeElement.querySelector('[data-testid="happy-customers-bar-link"]');
    expect(cta.classList).toContain('igx-button');
  });

  it('opens external review links safely in a new tab', () => {
    const links: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.hc_link')
    );
    expect(links.length).toBe(2);
    for (const link of links) {
      expect(link.target).toBe('_blank');
      expect(link.rel).toContain('noopener');
    }
  });

  it('formats YYYY-MM dates in Bulgarian', () => {
    expect(component.formatDate('2026-05')).toBe('май 2026');
    expect(component.formatDate('2026-01')).toBe('януари 2026');
  });

  it('falls back to the raw value for a malformed date', () => {
    expect(component.formatDate('may 2026')).toBe('may 2026');
    expect(component.formatDate('2026-13')).toBe('2026-13');
  });

  it('renders a five-glyph star row clamped to 0–5', () => {
    expect(component.stars(5)).toBe('★★★★★');
    expect(component.stars(4)).toBe('★★★★☆');
    expect(component.stars(9).length).toBe(5);
    expect(component.stars(-1)).toBe('☆☆☆☆☆');
  });

  it('pairs every decorative star row with accessible text', () => {
    // The ★ glyphs are aria-hidden, so a screen reader must get the rating from
    // the visually-hidden label instead.
    const decorative = fixture.nativeElement.querySelectorAll('.hc_stars[aria-hidden="true"]');
    const labels = fixture.nativeElement.querySelectorAll('.visually-hidden');
    expect(decorative.length).toBeGreaterThan(0);
    expect(labels.length).toBe(decorative.length);
  });

  it('builds an avatar initial from the author name', () => {
    expect(component.initial('Иван П.')).toBe('И');
    expect(component.initial('  мария Д.')).toBe('М');
  });

  it('uses the singular review count label for a single review', () => {
    expect(component.reviewCountLabel).toContain('ревю');
  });
});
