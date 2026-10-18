import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IgxIconComponent, IgxButtonDirective, IGX_INPUT_GROUP_DIRECTIVES, IGX_SELECT_DIRECTIVES, IGX_CARD_DIRECTIVES } from 'igniteui-angular';
import { SeoService, faqPageSchema } from '../services/seo.service';
import { FaqComponent, faqFor } from '../shared/faq/faq.component';
import { BUSINESS } from '../../data/business';
import { I18nService } from '../i18n/i18n.service';
import { TranslatePipe } from '../i18n/translate.pipe';
import type { TranslationKey } from '../i18n/i18n.types';
import pricesMessages from '../../i18n/bg/prices.json';

interface PricingTier {
  id: string;
  /** Translation keys — src/i18n/<lang>/prices.json `tiers`. */
  name: TranslationKey;
  pricePerTenGrams: number;
  description: TranslationKey;
  icon: string;
  colorClass: string;
  // Set to true on exactly one tier to show the "Най-търсено" badge.
  // Move it by flipping this flag — no other code changes needed.
  featured?: boolean;
}

@Component({
  selector: 'app-prices-page',
  imports: [FormsModule, IgxIconComponent, IgxButtonDirective, IGX_INPUT_GROUP_DIRECTIVES, IGX_SELECT_DIRECTIVES, IGX_CARD_DIRECTIVES, FaqComponent, TranslatePipe],
  templateUrl: './prices-page.component.html',
  styleUrls: ['./prices-page.component.scss']
})
export class PricesPageComponent {
  private readonly i18n = inject(I18nService);

  public tiers: PricingTier[] = [
    {
      id: 'single-basic',
      name: 'prices.tiers.singleBasic.name',
      pricePerTenGrams: 0.80,
      description: 'prices.tiers.singleBasic.description',
      icon: 'view_in_ar',
      colorClass: 'tier-c1'
    },
    {
      id: 'multi-basic',
      name: 'prices.tiers.multiBasic.name',
      pricePerTenGrams: 1.00,
      description: 'prices.tiers.multiBasic.description',
      icon: '3d_rotation',
      colorClass: 'tier-c2'
    },
    {
      id: 'single-complex',
      name: 'prices.tiers.singleComplex.name',
      pricePerTenGrams: 1.25,
      description: 'prices.tiers.singleComplex.description',
      icon: 'layers',
      colorClass: 'tier-c3',
      featured: true
    },
    {
      id: 'multi-complex',
      name: 'prices.tiers.multiComplex.name',
      pricePerTenGrams: 1.50,
      description: 'prices.tiers.multiComplex.description',
      icon: 'palette',
      colorClass: 'tier-c4'
    }
  ];

  public colorSwatches: { name: TranslationKey; image: string }[] = [
    { name: 'prices.colors.orange', image: '/assets/Auto generated image for 9e965d76-43bb-4cc0-9a7a-00fcf4f4f8fa-76de8869-605f-4b32-a064-d433f166f1e3.png' },
    { name: 'prices.colors.purple', image: '/assets/Auto generated image for 18dfca18-e335-4928-90d5-ebd3b35555b5-560a52a1-4370-441a-ade5-7acd2e759690.png' },
    { name: 'prices.colors.slateBlue', image: '/assets/Auto generated image for 23a34c67-82e6-40ee-8176-772b8598a10d-416f2e8f-78c0-4f5f-9531-ec07ad007f3f.png' },
    { name: 'prices.colors.sandPearl', image: '/assets/Auto generated image for 9dd1128d-b30c-4cd5-8683-0ca548892a5a-c726d54f-a69b-414a-99e9-999203613342.png' },
    { name: 'prices.colors.white', image: '/assets/Auto generated image for a4816c79-82cb-40f3-95e1-9ea1f454d882-9f1ea73f-669a-4fd8-ba6c-5c519c78e796.png' },
    { name: 'prices.colors.yellow', image: '/assets/Auto generated image for 902d11cc-abb2-475c-acb6-d1c6e14fd924-d7a24832-5257-4646-a0c0-53b04a38affb.png' },
    { name: 'prices.colors.pink', image: '/assets/Auto generated image for ce6479fc-7167-4df3-abfb-e2d8e063bbb1-ee4a6898-fdc4-42a4-ac67-9bf9990ab2f4.png' }
  ];

  /** Minimum order value in €: any non-empty order costs at least this much (business.json). */
  public readonly minimumOrder = BUSINESS.pricing.minimumOrder;

  /** null while the field is empty (ngModel on a number input). */
  public grams: number | null = 124;
  public selectedTierId = this.tiers[3].id; // Многоцветно (+ Труд), matches the original default example

  constructor(private router: Router, private seoService: SeoService) {
    // This page's Bulgarian strings live in its own chunk (src/i18n/bg/index.ts).
    this.i18n.registerPage('prices', pricesMessages);
    // Every number in the description comes from business.json, formatted for
    // the page's language („0,80“ / "0.80").
    const price = (value: number) => this.i18n.formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const { perTenGrams, minimumOrder } = BUSINESS.pricing;
    this.seoService.applyPageSeo('prices', {
      min: price(Math.min(...perTenGrams)),
      max: price(Math.max(...perTenGrams)),
      minOrder: this.i18n.formatNumber(minimumOrder)
    });
    // The visible FAQ (<app-faq>) mirrored 1:1 as FAQPage structured data, in
    // the page's language.
    this.seoService.setStructuredData({ '@context': 'https://schema.org', ...faqPageSchema(faqFor(this.i18n)) });
  }

  public get selectedTier(): PricingTier {
    return this.tiers.find(t => t.id === this.selectedTierId) ?? this.tiers[0];
  }

  // (grams / 10) * price per 10g, before the minimum order is applied
  public get weightPrice(): number {
    return Math.max(this.grams || 0, 0) / 10 * this.selectedTier.pricePerTenGrams;
  }

  /** True when the weight price is below the minimum, so the minimum is charged. */
  public get minimumApplies(): boolean {
    return this.weightPrice > 0 && this.weightPrice < this.minimumOrder;
  }

  public get totalPrice(): string {
    return (this.minimumApplies ? this.minimumOrder : this.weightPrice).toFixed(2);
  }

  public selectTier(tierId: string): void {
    this.selectedTierId = tierId;
  }

  public navigateWithEstimate(): void {
    const message = this.i18n.t('prices.calculator.orderMessage', {
      grams: this.grams ?? '',
      tier: this.i18n.t(this.selectedTier.name),
      total: this.totalPrice
    });

    this.router.navigate([this.i18n.path('/contact')], {
      state: {
        prefilledMessage: message
      }
    });
  }
}
