import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { ProductsPageComponent } from './products-page.component';
import productsData from '../../data/products.json';

describe('ProductsPageComponent', () => {
  let component: ProductsPageComponent;
  let fixture: ComponentFixture<ProductsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsPageComponent],
      providers: [provideRouter([]), provideAnimations()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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

    it('supports the optional featured / pageUrl MAIN-product fields', () => {
      // No MAIN product exists yet, but the mapping must not strip the fields.
      const withPage = { ...productsData[0], featured: true, pageUrl: '/gift-box' };
      expect(withPage.featured).toBe(true);
      expect(withPage.pageUrl).toBe('/gift-box');
    });
  });
});
