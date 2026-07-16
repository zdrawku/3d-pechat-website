import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IgxIconComponent, IGX_INPUT_GROUP_DIRECTIVES, IGX_SELECT_DIRECTIVES, IGX_CARD_DIRECTIVES } from 'igniteui-angular';
import { SeoService } from '../services/seo.service';

interface PricingTier {
  id: string;
  name: string;
  pricePerTenGrams: number;
  description: string;
  icon: string;
  colorClass: string;
  // Set to true on exactly one tier to show the "Най-търсено" badge.
  // Move it by flipping this flag — no other code changes needed.
  featured?: boolean;
}

@Component({
  selector: 'app-prices-page',
  imports: [FormsModule, IgxIconComponent, IGX_INPUT_GROUP_DIRECTIVES, IGX_SELECT_DIRECTIVES, IGX_CARD_DIRECTIVES],
  templateUrl: './prices-page.component.html',
  styleUrls: ['./prices-page.component.scss']
})
export class PricesPageComponent {
  public tiers: PricingTier[] = [
    {
      id: 'single-basic',
      name: 'Едноцветно (Базово)',
      pricePerTenGrams: 0.80,
      description: 'Стандартен печат, без сложна обработка.',
      icon: 'view_in_ar',
      colorClass: 'tier-c1'
    },
    {
      id: 'multi-basic',
      name: 'Многоцветно (Базово)',
      pricePerTenGrams: 1.00,
      description: 'Много цветове, без сложна обработка.',
      icon: '3d_rotation',
      colorClass: 'tier-c2'
    },
    {
      id: 'single-complex',
      name: 'Едноцветно (+ Труд)',
      pricePerTenGrams: 1.25,
      description: 'Сложни модели, изискващи почистване на подпори.',
      icon: 'layers',
      colorClass: 'tier-c3',
      featured: true
    },
    {
      id: 'multi-complex',
      name: 'Многоцветно (+ Труд)',
      pricePerTenGrams: 1.50,
      description: 'Сложни многоцветни модели, изискващи повече внимание.',
      icon: 'palette',
      colorClass: 'tier-c4'
    }
  ];

  public colorSwatches = [
    { name: 'Оранжево', image: '/assets/Auto generated image for 9e965d76-43bb-4cc0-9a7a-00fcf4f4f8fa-76de8869-605f-4b32-a064-d433f166f1e3.png' },
    { name: 'Лилаво', image: '/assets/Auto generated image for 18dfca18-e335-4928-90d5-ebd3b35555b5-560a52a1-4370-441a-ade5-7acd2e759690.png' },
    { name: 'Сиво-синьо', image: '/assets/Auto generated image for 23a34c67-82e6-40ee-8176-772b8598a10d-416f2e8f-78c0-4f5f-9531-ec07ad007f3f.png' },
    { name: 'Пясък-перла', image: '/assets/Auto generated image for 9dd1128d-b30c-4cd5-8683-0ca548892a5a-c726d54f-a69b-414a-99e9-999203613342.png' },
    { name: 'Бяло', image: '/assets/Auto generated image for a4816c79-82cb-40f3-95e1-9ea1f454d882-9f1ea73f-669a-4fd8-ba6c-5c519c78e796.png' },
    { name: 'Жълто', image: '/assets/Auto generated image for 902d11cc-abb2-475c-acb6-d1c6e14fd924-d7a24832-5257-4646-a0c0-53b04a38affb.png' },
    { name: 'Розово', image: '/assets/Auto generated image for ce6479fc-7167-4df3-abfb-e2d8e063bbb1-ee4a6898-fdc4-42a4-ac67-9bf9990ab2f4.png' }
  ];

  public grams = 124;
  public selectedTierId = this.tiers[3].id; // Многоцветно (+ Труд), matches the original default example

  constructor(private router: Router, private seoService: SeoService) {
    this.seoService.updateSeo({
      title: 'Цени за 3D печат - 3D Печат България',
      description: 'Вижте нашите цени за 3D печат услуги. Калкулатор за изчисляване на цена на 3D принтиране по грамаж и материал.',
      keywords: '3D печат цени, цена 3D принтиране, калкулатор 3D печат, PLA цена, ABS цена, PETG цена',
      url: 'https://3dpechat.bg/prices/',
      type: 'website'
    });
    this.seoService.removeStructuredData();
  }

  public get selectedTier(): PricingTier {
    return this.tiers.find(t => t.id === this.selectedTierId) ?? this.tiers[0];
  }

  // (grams / 10) * price per 10g
  public get totalPrice(): string {
    const total = ((this.grams || 0) / 10) * this.selectedTier.pricePerTenGrams;
    return total.toFixed(2);
  }

  public selectTier(tierId: string): void {
    this.selectedTierId = tierId;
  }

  public navigateWithEstimate(): void {
    const message = `Привет, искам да поръчам 3D печат: ${this.grams}г, ${this.selectedTier.name} (~${this.totalPrice} EURO).`;

    this.router.navigate(['/contact'], {
      state: {
        prefilledMessage: message
      }
    });
  }
}
