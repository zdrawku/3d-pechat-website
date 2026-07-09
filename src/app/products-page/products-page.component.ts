import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IgxButtonDirective, IgxIconModule, IgxInputGroupModule, IgxSelectModule } from 'igniteui-angular';

import { ProductGridComponent } from '../shared/product-grid/product-grid.component';
import { SeoService } from '../services/seo.service';

interface ProductVariant {
  id: number;
  name: string;
  linkId: string;
  description: string;
  frontImage?: string;
  backImage?: string;
  dateAdded?: string;
  hasOldCoins: boolean;
  hasEuroCoins: boolean;
  hasImagePadding?: boolean;
  showFront: boolean; // Track which side is showing
  customContent?: {
    show: boolean;
    title: string;
    items: string[];
  };
  tags?: string[];
}

@Component({
  selector: 'app-products-page',
  imports: [FormsModule, IgxButtonDirective, ProductGridComponent, IgxIconModule, IgxInputGroupModule, IgxSelectModule],
  templateUrl: './products-page.component.html',
  styleUrls: ['./products-page.component.scss']
})
export class ProductsPageComponent {
  // To add product images:
  // 1. Place images in: src/assets/real-images/bg-cards/
  // 2. Update the frontImage and backImage properties in productVariants array below
  // 3. Images will automatically display in the flippable cards

  public productVariants: ProductVariant[] = [
    {
      id: 1,
      linkId: 'where-we-met',
      name: 'Къде се срещнахме? Романтичен подарък за вашият партньор!',
      description: 'Романтичен подарък, който посочва мястото с координати на запознанството с партньора ви.',
      frontImage: '/assets/real-images/where-we-met.webp',
      backImage: '/assets/real-images/where-we-met-1.webp',
      dateAdded: '2025-02-14',
      hasOldCoins: false,
      hasEuroCoins: false,
      hasImagePadding: true,
      showFront: true,
      tags: ['подарък', 'Свети Валентин', 'Валентин', 'годишнина', 'карта', 'локация', 'романтика', 'любов']
    },
    {
      id: 2,
      linkId: 'variant-1',
      name: 'Вариант 1: Правоъгълна карта с българско знаме',
      description: 'Правоъгълна монетна карта с българско знаме с хоризонтални цветове отпред.',
      frontImage: '/assets/real-images/bg-cards/variant-1-front.webp',
      backImage: '/assets/real-images/bg-cards/variant-1-back.webp',
      dateAdded: '2024-01-01',
      hasOldCoins: true,
      hasEuroCoins: true,
      showFront: true,
      tags: ['монетна карта', 'българия', 'знаме', 'колекция', 'подарък', 'монети']
    },
    {
      id: 4,
      linkId: 'variant-2',
      name: 'Вариант 2: България карта с хоризонтални линии',
      description: 'България карта с форма на картата на страната с хоризонтални цветни линии.',
      frontImage: '/assets/real-images/bg-cards/variant-3-front.webp',
      backImage: '/assets/real-images/bg-cards/variant-3-back.webp',
      dateAdded: '2024-01-01',
      hasOldCoins: true,
      hasEuroCoins: true,
      showFront: true,
      tags: ['монетна карта', 'българия', 'знаме', 'колекция', 'подарък', 'монети']
    },
    {
      id: 6,
      linkId: 'variant-3',
      name: 'Вариант 3: Европейски съюз Българска карта чисто синьо',
      description: 'България карта с дизайн на Европейския съюз - син фон с жълти звезди.',
      frontImage: '/assets/real-images/bg-cards/variant-5-front.webp',
      backImage: '/assets/real-images/bg-cards/variant-5-back.webp',
      dateAdded: '2024-01-01',
      hasOldCoins: true,
      hasEuroCoins: true,
      showFront: true,
      tags: ['монетна карта', 'българия', 'знаме', 'колекция', 'подарък', 'монети']
    },
    {
      id: 7,
      linkId: 'variant-4',
      name: 'Вариант 4: Персонализирани Български или правоъгълни карти',
      description: 'Персонализирани карти - вие решавате дизайна, формата на картата, дали да има контурна снимка или държавно знаме отпред или отзад. Небето е границата!',
      frontImage: '/assets/real-images/bg-cards/variant-10-front.webp',
      backImage: '/assets/real-images/bg-cards/variant-10-back.webp',
      dateAdded: '2024-01-01',
      hasOldCoins: false,
      hasEuroCoins: false,
      showFront: true,
      customContent: {
        show: true,
        title: '✨ Можете да персонализирате всеки аспект:',
        items: [
          'Форма на картата',
          'Снимка или дизайн отпред/отзад',
          'Българско знаме или друг дизайн',
          'Размер и брой слотове за монети',
          'Специални гравюри или текст'
        ]
      },
      tags: ['монетна карта', 'българия', 'знаме', 'колекция', 'подарък', 'монети']
    },
    {
      id: 8,
      linkId: 'variant-5',
      name: 'Вариант 5: Правоъгълни карти с премиум кейс',
      description: 'Персонализирани правоъгълни карти с премиум кейс за съхранение.',
      frontImage: '/assets/real-images/Variant-7-back.webp',
      backImage: '/assets/real-images/Variant-7-front.webp',
      dateAdded: '2024-06-01',
      hasOldCoins: false,
      hasEuroCoins: false,
      showFront: true,
      customContent: {
        show: true,
        title: '✨ Различни цветове на картата и кейса:',
        items: [
          'Зелен кейс, бордо червен или черен',
          'Правоъгълна карта с наклонено знаме',
          'Правоъгълна монетна карта с наклонено българско знаме (45 градуса)'
        ]
      },
      tags: ['монетна карта', 'българия', 'знаме', 'колекция', 'подарък', 'монети', 'премиум']
    },
    {
      id: 9,
      linkId: 'headphone-stand',
      name: 'Стойка за слушалки 20 см',
      description: '3D принтирана стойка за слушалки с опция за отвор за касичка.',
      frontImage: '/assets/real-images/headphoneStand-back.webp',
      backImage: '/assets/real-images/headphoneStand-front-2.webp',
      dateAdded: '2024-01-01',
      hasOldCoins: false,
      hasEuroCoins: false,
      showFront: true,
      customContent: {
        show: true,
        title: '✨ Можете да персонализирате всеки аспект:',
        items: [
          'Големина на стойката до 25 см височина',
          'Стойката може да има отвор отгоре за касичка',
          'Цвят по избор',
          'Отлично за бюро'
        ]
      },
      tags: ['слушалки', 'стойка', 'гейминг', 'офис', 'аксесоар', 'музика', 'премиум']
    },
    {
      id: 10,
      linkId: 'headphone-stand-big',
      name: 'Стойка за слушалки 25 см',
      description: '3D принтирана стойка за слушалки с опция за отвор за касичка, 25 см. височина.',
      frontImage: '/assets/real-images/headphoneStand-front-3.webp',
      backImage: '/assets/real-images/headphoneStand-front-4.webp',
      dateAdded: '2026-03-04',
      hasOldCoins: false,
      hasEuroCoins: false,
      showFront: true,
      customContent: {
        show: true,
        title: '✨ Можете да персонализирате всеки аспект:',
        items: [
          'Големина на стойката до 25 см височина',
          'Стойката може да има отвор отгоре за касичка',
          'Цвят по избор',
          'Отлично за бюро'
        ]
      },
      tags: ['слушалки', 'стойка', 'гейминг', 'офис', 'аксесоар', 'музика', 'премиум']
    },
    {
      id: 11,
      linkId: 'photo-frame',
      name: 'Поставка/Рамка за снимки!',
      description: 'Елегантна 3D принтирана поставка за снимки — идеален подарък за съхранение на скъпи спомени с близките ви.',
      frontImage: '/assets/real-images/ramka-1.webp',
      backImage: '/assets/real-images/ramka-2.webp',
      dateAdded: '2026-03-04',
      hasOldCoins: false,
      hasEuroCoins: false,
      hasImagePadding: true,
      showFront: true,
      tags: ['подарък', 'Свети Валентин', 'Валентин', 'годишнина', 'карта', 'локация', 'романтика', 'любов']
    },
    {
      id: 12,
      linkId: 'photo-frame',
      name: 'Стенна рамка за снимки!',
      description: 'Романтичен подарък, стенна рамка за снимки внасяща уют във всеки дом.',
      frontImage: '/assets/real-images/ramka.webp',
      dateAdded: '2026-01-01',
      hasOldCoins: false,
      hasEuroCoins: false,
      hasImagePadding: true,
      showFront: true,
      tags: ['подарък', 'Свети Валентин', 'Валентин', 'годишнина', 'карта', 'локация', 'романтика', 'любов']
    }
  ];

  public searchText = '';
  // The initial selection is set here
  public sortOrder = 'newest'; 

  public get isSearchOrSortActive(): boolean {
    return this.searchText.length > 0 || this.sortOrder !== 'default';
  }

  public get allFilteredProducts(): ProductVariant[] {
    const allProducts = [...this.productVariants];
    return this.filterAndSortProducts(allProducts);
  }

  public get filteredProductVariants(): ProductVariant[] {
    return this.filterAndSortProducts(this.productVariants);
  }


  private filterAndSortProducts(products: ProductVariant[]): ProductVariant[] {
    let filtered = products.filter(product => {
      const search = this.searchText.toLowerCase();
      const inName = product.name.toLowerCase().includes(search);
      const inDescription = product.description.toLowerCase().includes(search);
      const inCustomContentTitle = product.customContent?.title.toLowerCase().includes(search) || false;
      const inCustomContentItems = product.customContent?.items.some(item => item.toLowerCase().includes(search)) || false;
      const inTags = product.tags?.some(tag => tag.toLowerCase().includes(search)) || false;

      return inName || inDescription || inCustomContentTitle || inCustomContentItems || inTags;
    });

    if (this.sortOrder === 'asc') {
      filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.sortOrder === 'desc') {
      filtered = filtered.sort((a, b) => b.name.localeCompare(a.name));
    } else if (this.sortOrder === 'newest') {
      filtered = filtered.sort((a, b) => {
        const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
        const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
        return dateB - dateA;
      });
    } else if (this.sortOrder === 'oldest') {
      filtered = filtered.sort((a, b) => {
        const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
        const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
        return dateA - dateB;
      });
    }

    return filtered;
  }

  constructor(private router: Router, private seoService: SeoService) {
    this.seoService.updateSeo({
      title: 'Продукти - 3D Печат България',
      description: 'Разгледайте нашите 3D принтирани продукти - монетни карти с българско знаме, стойки за слушалки и персонализирани продукти по поръчка.',
      keywords: '3D принтирани продукти, монетни карти, стойки за слушалки, персонализирани продукти, 3D печат по поръчка',
      url: 'https://3dpechat.bg/products',
      type: 'website'
    });
    this.seoService.removeStructuredData();
  }

  public navigateToContact(): void {
    this.router.navigate(['/contact']);
  }

  public orderProduct(product: ProductVariant): void {
    const message = `Привет, искам да поръчам "${product.name}". ${product.description}`;

    this.router.navigate(['/contact'], {
      state: {
        prefilledMessage: message,
        productName: product.name
      }
    });
  }

  public copySectionLink(sectionId: string): void {
    // 1. Construct the URL
    const url = new URL(window.location.href);
    url.hash = sectionId;
    const newUrl = url.href;

    // 2. Update Browser URL (Visual only, no reload)
    window.history.pushState(null, '', newUrl);

    // 3. Smooth Scroll to the Section
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',   // Aligns the top of the element with the top of the viewport
        inline: 'nearest'
      });
    }

    // 4. Copy to Clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(newUrl).then(() => {
        // Optional: Add a toast notification here
        console.log('Link copied and scrolled!');
      });
    } else {
      // Fallback for older browsers
      const tempInput = document.createElement('input');
      tempInput.value = newUrl;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
    }
  }
}
