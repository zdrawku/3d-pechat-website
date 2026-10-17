import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EnPageComponent } from './en-page.component';
import { BUSINESS, priceRangeEn } from '../../data/business';

describe('EnPageComponent', () => {
  let fixture: ComponentFixture<EnPageComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnPageComponent],
      providers: [provideRouter([])]
    }).compileComponents();
    fixture = TestBed.createComponent(EnPageComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  afterEach(() => {
    // SeoService touches the shared test document; restore the site default.
    document.documentElement.setAttribute('lang', 'bg');
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(l => l.remove());
  });

  it('builds the page from Ignite UI components', () => {
    expect(el.querySelectorAll('igx-card').length).withContext('igx-card').toBeGreaterThanOrEqual(7);
    expect(el.querySelectorAll('igx-avatar').length).withContext('step numbers as igx-avatar').toBe(4);
    expect(el.querySelectorAll('igx-icon').length).withContext('igx-icon').toBeGreaterThan(4);
    expect(el.querySelector('a[igxButton="contained"][data-testid="en-cta-quote"]')).withContext('quote CTA link').not.toBeNull();
    expect(el.querySelector('a[igxButton="outlined"]')).withContext('portfolio CTA link').not.toBeNull();
  });

  it('marks the page as English with hreflang alternates for the home page pair', () => {
    expect(document.documentElement.getAttribute('lang')).toBe('en');
    const alt = (h: string) => document.head.querySelector(`link[rel="alternate"][hreflang="${h}"]`)?.getAttribute('href');
    expect(alt('bg')).toBe('https://3dpechat.bg/');
    expect(alt('en')).toBe('https://3dpechat.bg/en/');
    expect(alt('x-default')).toBe('https://3dpechat.bg/');
    expect(document.head.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe('en_US');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://3dpechat.bg/en/');
  });

  it('states the business.json numbers, not hand-typed ones', () => {
    const text = el.textContent ?? '';
    expect(text).toContain(priceRangeEn());
    expect(text).toContain(`Minimum order: €${BUSINESS.pricing.minimumOrder}`);
    expect(text).toContain(`${BUSINESS.leadTimeWorkingDays.small} working days`);
    expect(text).toContain(`+${BUSINESS.rushSurchargePercent}%`);
    expect(text).toContain(`Delivery is free anywhere in Bulgaria for orders over €${BUSINESS.freeDeliveryOverEur}`);
    expect(text).toContain('The first quote is free');
    expect(text).toContain('in English or Bulgarian');
    expect(text).toContain(BUSINESS.displayAddressEn);
    expect(text).toContain('Every day, 9:00–18:00');
    expect(text).toContain(BUSINESS.email);
  });

  it('never offers what the business does not do', () => {
    const text = el.textContent ?? '';
    expect(text).not.toMatch(/\bSLA\b|\bSLS\b|resin|scanning|same[- ]day/i);
    expect(text).toContain('We don’t issue invoices');
  });

  it('links back to the Bulgarian site', () => {
    const back = el.querySelector<HTMLAnchorElement>('.en-back a');
    expect(back?.getAttribute('href')).toBe('/');
    expect(back?.getAttribute('hreflang')).toBe('bg');
  });
});
