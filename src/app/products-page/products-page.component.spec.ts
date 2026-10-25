import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ProductsPageComponent } from './products-page.component';
import { Product, ProductVariant } from '../models/product.model';
import productsData from '../../data/products.json';
import { VIDEOS } from '../shared/youtube-embed/video.util';
import { I18nService } from '../i18n/i18n.service';
import { localizeProduct } from '../i18n/localized-content';
import { AnalyticsService } from '../services/analytics.service';

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

  describe('analytics', () => {
    let track: jasmine.Spy;
    let navigate: jasmine.Spy;

    beforeEach(() => {
      track = spyOn(TestBed.inject(AnalyticsService), 'track');
      navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    });

    it('reports an order click with the product, and tells the form the lead came from it', () => {
      const product = component.productVariants[0];
      component.orderProduct(product);

      expect(track).toHaveBeenCalledOnceWith('order_click', { product_id: product.linkId, product_name: product.name });
      expect(navigate.calls.mostRecent().args[1]?.state?.['leadSource']).toBe('product_order');
    });

    it('reports the page’s „ask for an offer“ button as a quote click', () => {
      component.navigateToContact();
      expect(track).toHaveBeenCalledOnceWith('quote_click', { cta_location: 'products_cta' });
    });
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
      // No MAIN product exists yet, but the mapping — with or without another
      // language's copy laid over it — must not strip these fields.
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
      for (const mapped of [localizeProduct(mockProduct, undefined), localizeProduct(mockProduct, { name: 'T', description: 'D' })]) {
        expect(mapped.featured).toBe(true);
        expect(mapped.pageUrl).toBe('/gift-box');
      }
    });
  });

  describe('in English (/en/products/)', () => {
    const source = (linkId: string) => (productsData as Product[]).find((p) => p.linkId === linkId)!;

    beforeEach(async () => {
      await TestBed.inject(I18nService).use('en');
      fixture = TestBed.createComponent(ProductsPageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('shows every product with its English copy over the catalogue’s images and links', () => {
      expect(component.productVariants.length).toBe(productsData.length);
      for (const product of component.productVariants) {
        const original = source(product.linkId);
        // A product added from the phone has no English copy until someone
        // writes it: it shows the Bulgarian text marked lang="bg", and
        // i18n.spec.ts reports it as pending — not a failure here.
        if (product.copyLang) {
          expect(product.copyLang).withContext(product.linkId).toBe('bg');
          expect(product.name).withContext(product.linkId).toBe(original.name);
        } else {
          expect(product.name).withContext(product.linkId).not.toBe(original.name);
        }
        expect(product.frontImage).withContext(product.linkId).toBe(original.frontImage);
        expect((product.links ?? []).map((l) => l.url)).withContext(product.linkId)
          .toEqual((original.links ?? []).map((l) => l.url));
        expect(product.readMore?.url).withContext(product.linkId).toBe(original.readMore?.url);
      }
    });

    it('labels the video link in English', () => {
      const link = (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLAnchorElement>('#razdeliteli-za-knigi a[data-testid="product-external-link"][href*="youtu.be"]');
      expect(link?.getAttribute('aria-label')).toBe('Watch it in the video');
    });

    it('links „read more“ to the article’s English translation', () => {
      const readMore = (fixture.nativeElement as HTMLElement).querySelector('#variant-1 [data-testid="product-read-more"]');
      expect(readMore?.getAttribute('href')).toBe('/en/blog/bulgarian-euro-coin-holder-card');
      expect(readMore?.hasAttribute('hreflang')).toBeFalse();
      expect(readMore?.textContent?.trim()).toBe('Read more arrow_forward');
    });

    it('opens the English contact form with an English order message', () => {
      const router = TestBed.inject(Router);
      const navigate = spyOn(router, 'navigate').and.resolveTo(true);
      const product = component.productVariants.find((p) => p.linkId === 'variant-1') as ProductVariant;

      component.orderProduct(product);

      const [commands, extras] = navigate.calls.mostRecent().args;
      expect(commands).toEqual(['/en/contact']);
      expect(extras?.state?.['prefilledMessage']).toBe(`Hello, I would like to order "${product.name}". ${product.description}`);
      expect(extras?.state?.['productName']).toBe(product.name);
    });
  });
});
