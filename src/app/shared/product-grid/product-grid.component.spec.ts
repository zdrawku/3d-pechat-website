import { ComponentFixture, TestBed } from '@angular/core/testing';

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
      imports: [ProductGridComponent]
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
});
