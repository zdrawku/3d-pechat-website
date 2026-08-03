import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ProductGridComponent } from './product-grid.component';
import { ProductVariant } from '../../models/product.model';

describe('ProductGridComponent', () => {
  let component: ProductGridComponent;
  let fixture: ComponentFixture<ProductGridComponent>;

  const makeProduct = (id: number): ProductVariant => ({
    id,
    linkId: `product-${id}`,
    name: `Product ${id}`,
    description: 'Desc',
    hasOldCoins: false,
    hasEuroCoins: false,
    showFront: true
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // NoopAnimationsModule is required as soon as a card actually renders:
      // igxButton's ripple injects AnimationBuilder (NG03600 without it).
      imports: [ProductGridComponent, NoopAnimationsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('flip state', () => {
    it('starts showing the front of every card', () => {
      const product = makeProduct(1);
      expect(component.isShowingFront(product)).toBe(true);
    });

    it('toggles the flip state locally without mutating the input product', () => {
      const product = makeProduct(2);
      const event = new Event('click');

      component.toggleToNext(product, event);

      expect(component.isShowingFront(product)).toBe(false);
      expect(product.showFront).toBe(true); // input object is untouched

      component.toggleToPrevious(product, event);
      expect(component.isShowingFront(product)).toBe(true);
    });

    it('tracks flip state independently per product id', () => {
      const productA = makeProduct(3);
      const productB = makeProduct(4);

      component.toggleToNext(productA, new Event('click'));

      expect(component.isShowingFront(productA)).toBe(false);
      expect(component.isShowingFront(productB)).toBe(true);
    });
  });

  describe('order button', () => {
    beforeEach(() => {
      component.products = [makeProduct(1)];
      fixture.detectChanges();
    });

    // On narrow screens CSS hides the label and shows the cart icon instead, so
    // the accessible name has to come from aria-label — without it the button
    // would announce as the raw "shopping_cart" ligature text.
    it('keeps an accessible name when the label is hidden on narrow screens', () => {
      const btn: HTMLElement = fixture.nativeElement.querySelector('[data-testid="product-order-btn"]');
      expect(btn.getAttribute('aria-label')).toBe('Поръчайте сега');
    });

    it('hides both decorative icons from assistive tech', () => {
      const icons = fixture.nativeElement.querySelectorAll(
        '[data-testid="product-order-btn"] igx-icon'
      );
      expect(icons.length).toBe(2);
      icons.forEach((icon: Element) => {
        expect(icon.getAttribute('aria-hidden')).toBe('true');
      });
    });

    // The label element must stay in the DOM — the responsive collapse is
    // CSS-only, so removing it would break the wide layout.
    it('renders the visible label for wide layouts', () => {
      const label = fixture.nativeElement.querySelector('.contact-button_label');
      expect(label?.textContent?.trim()).toBe('Поръчайте сега');
    });
  });
});
