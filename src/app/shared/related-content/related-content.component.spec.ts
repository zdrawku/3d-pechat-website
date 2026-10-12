import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RelatedContentComponent } from './related-content.component';

describe('RelatedContentComponent', () => {
  let fixture: ComponentFixture<RelatedContentComponent>;
  let component: RelatedContentComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelatedContentComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(RelatedContentComponent);
    component = fixture.componentInstance;
    component.slug = '3d-printing-technologies';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows three related articles, never the current one', () => {
    expect(component.posts.length).toBe(3);
    expect(component.posts.some((p) => p.slug === '3d-printing-technologies')).toBeFalse();

    const items = fixture.nativeElement.querySelectorAll('[data-testid="related-posts"] .rc_card');
    expect(items.length).toBe(3);
  });

  it('shows up to three catalog products linking to their card on /products', () => {
    expect(component.products.length).toBe(3);

    const links: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="related-products"] a[igxButton]')
    );
    expect(links.length).toBe(3);
    expect(links.every((a) => (a.getAttribute('href') ?? '').startsWith('/products'))).toBeTrue();
    expect(links.every((a) => (a.getAttribute('href') ?? '').includes('#'))).toBeTrue();
  });

  it('renders nothing for an unknown slug', () => {
    const other = TestBed.createComponent(RelatedContentComponent);
    other.componentInstance.slug = 'no-such-post';
    other.detectChanges();
    expect(other.nativeElement.querySelector('[data-testid="related-content"]')).toBeNull();
  });

  // The whole site is built on Ignite UI; this guards against a later edit
  // quietly replacing the components with hand-rolled plain-HTML equivalents.
  it('builds the block from Ignite UI components', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelectorAll('igx-card').length).toBe(6);
    expect(host.querySelectorAll('igx-card-media').length).toBe(6);
    expect(host.querySelectorAll('igx-card-header').length).toBe(3);
    expect(host.querySelectorAll('[igxButton]').length).toBeGreaterThanOrEqual(8);
    expect(host.querySelectorAll('igx-icon').length).toBeGreaterThan(0);
  });
});
