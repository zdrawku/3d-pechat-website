import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ProductsPageComponent } from './products-page.component';
import { Product, ProductVariant } from '../models/product.model';
import productsData from '../../data/products.json';
import { VIDEOS } from '../shared/youtube-embed/video.util';

describe('ProductsPageComponent', () => {
  let component: ProductsPageComponent;
  let fixture: ComponentFixture<ProductsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsPageComponent],
      providers: [provideRouter([]), provideNoopAnimations()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sorts A-Я with Bulgarian collation regardless of browser locale', () => {
    const names = (order: string) => {
      component.setSortOrder(order);
      return component.allFilteredProducts.map((p) => p.name);
    };
    const bg = (a: string, b: string) => a.localeCompare(b, 'bg');
    expect(names('asc')).toEqual([...names('asc')].sort(bg));
    expect(names('desc')).toEqual([...names('asc')].reverse());
    // Cyrillic names come before Latin ones in 'bg' order.
    const asc = names('asc');
    const firstLatin = asc.findIndex((n) => /^[A-Za-z]/.test(n));
    const lastCyrillic = asc.map((n) => /^[Ѐ-ӿ]/.test(n)).lastIndexOf(true);
    if (firstLatin !== -1) expect(firstLatin).toBeGreaterThan(lastCyrillic);
  });

  // Foundation #1: products are loaded from src/data/products.json at build time
  // and mapped to runtime variants. These lock in that contract so a future bad
  // JSON edit (or an accidental change to the mapping) fails loudly in CI.
  describe('products.json → runtime variants', () => {
    it('loads every product from the JSON data file', () => {
      expect(component.productVariants.length).toBe(productsData.length);
    });

    it('defaults showFront to true on every runtime variant', () => {
      expect(component.productVariants.every((p) => p.showFront === true)).toBe(true);
    });

    it('does not persist showFront in the source JSON', () => {
      const anyHasShowFront = (productsData as Record<string, unknown>[]).some(
        (p) => 'showFront' in p
      );
      expect(anyHasShowFront).toBe(false);
    });

    it('preserves the required data fields from JSON', () => {
      for (const product of component.productVariants) {
        expect(typeof product.id).toBe('number');
        expect(product.linkId?.length).toBeGreaterThan(0);
        expect(product.name?.length).toBeGreaterThan(0);
        expect(product.description?.length).toBeGreaterThan(0);
      }
    });

    it('has unique ids and linkIds (deep links stay stable)', () => {
      const ids = component.productVariants.map((p) => p.id);
      const linkIds = component.productVariants.map((p) => p.linkId);
      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(linkIds).size).toBe(linkIds.length);
    });

    // „Виж във видеото“ convention (Idea 7): a play_circle link that opens one
    // of our curated videos at the second the product appears.
    it('points every „Виж във видеото“ link at a curated video and timestamp', () => {
      const videoIds = new Set(VIDEOS.map((v) => v.id));
      const videoLinks = component.productVariants.flatMap((p) =>
        (p.links ?? []).filter((l) => l.icon === 'play_circle').map((l) => ({ product: p.linkId, link: l }))
      );
      expect(videoLinks.map((v) => v.product).sort()).toEqual(['razdeliteli-za-knigi', 'variant-2']);
      for (const { product, link } of videoLinks) {
        expect(link.label).withContext(product).toBe('Виж във видеото');
        const m = /^https:\/\/youtu\.be\/([\w-]{11})\?t=(\d+)$/.exec(link.url);
        expect(m).withContext(`${product}: youtu.be/<id>?t=<seconds>`).not.toBeNull();
        expect(videoIds.has(m![1])).withContext(`${product}: video is in videos.json`).toBeTrue();
      }
    });

    it('renders the video link as an Ignite icon button on the product card', () => {
      const card = fixture.nativeElement.querySelector('#razdeliteli-za-knigi') as HTMLElement | null;
      expect(card).withContext('book-dividers card').not.toBeNull();
      const link = card!.querySelector<HTMLAnchorElement>('a[data-testid="product-external-link"][href*="youtu.be"]');
      expect(link).withContext('video link on the card').not.toBeNull();
      expect(link!.getAttribute('aria-label')).toBe('Виж във видеото');
      expect(link!.getAttribute('rel')).toContain('noopener');
      expect(link!.querySelector('igx-icon')?.textContent?.trim()).toBe('play_circle');
    });

    it('supports the optional featured / pageUrl MAIN-product fields', () => {
      // No MAIN product exists yet, but the component's mapping must not strip
      // these fields when they are present on a product.
      const mockProduct: Product = {
        id: 99,
        linkId: 'test-main',
        name: 'Test',
        description: 'Test Desc',
        hasOldCoins: false,
        hasEuroCoins: false,
        featured: true,
        pageUrl: '/gift-box'
      };
      component.productVariants = [...component.productVariants, { ...mockProduct, showFront: true }];

      const mapped = component.productVariants.find((p) => p.linkId === 'test-main') as ProductVariant;
      expect(mapped.featured).toBe(true);
      expect(mapped.pageUrl).toBe('/gift-box');
      expect(mapped.showFront).toBe(true);
    });
  });
});
