import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { IGX_CARD_DIRECTIVES, IgxAvatarComponent, IgxIconComponent, IGX_INPUT_GROUP_DIRECTIVES, IGX_SELECT_DIRECTIVES } from 'igniteui-angular';
import { PricesPageComponent } from './prices-page.component';
import business from '../../data/business.json';

describe('PricesPageComponent', () => {
  let component: PricesPageComponent;
  let fixture: ComponentFixture<PricesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricesPageComponent, NoopAnimationsModule, FormsModule, ReactiveFormsModule, IGX_CARD_DIRECTIVES, IgxAvatarComponent, IgxIconComponent, IGX_INPUT_GROUP_DIRECTIVES, IGX_SELECT_DIRECTIVES]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PricesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('minimum order', () => {
    const el = (): HTMLElement => fixture.nativeElement;

    it('charges the 3 € minimum when the weight price is below it', () => {
      component.selectTier('single-basic');
      component.grams = 10; // 10 g / 10 × 0.80 € = 0.80 €
      fixture.detectChanges();

      expect(component.weightPrice).toBeCloseTo(0.8, 5);
      expect(component.totalPrice).toBe('3.00');
      expect(el().querySelector('[data-testid="calc-minimum"]')).withContext('minimum notice').not.toBeNull();
      expect(el().querySelector('[data-testid="calc-minimum"] igx-icon')).withContext('Ignite icon').not.toBeNull();
    });

    it('uses the weight price once it reaches the minimum', () => {
      component.selectTier('single-basic');
      component.grams = 100; // 8.00 €
      fixture.detectChanges();

      expect(component.totalPrice).toBe('8.00');
      expect(el().querySelector('[data-testid="calc-minimum"]')).toBeNull();
    });

    it('keeps an empty order at 0.00 € instead of the minimum', () => {
      component.grams = 0;
      fixture.detectChanges();
      expect(component.totalPrice).toBe('0.00');
      expect(component.minimumApplies).toBeFalse();
    });

    it('always states the minimum order value', () => {
      expect(el().querySelector('[data-testid="calc-minimum-rule"]')?.textContent).toContain('3.00 €');
    });

    it('matches the minimum order in business.json (the source for all copy)', () => {
      expect(business.facts.join(' ')).toContain(`Минималната стойност на поръчка е ${component.minimumOrder} €`);
    });
  });
});
