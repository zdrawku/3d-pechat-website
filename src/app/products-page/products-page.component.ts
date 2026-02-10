import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IgxButtonDirective, IgxIconModule } from 'igniteui-angular';
import { CommonModule } from '@angular/common';
import { ProductGridComponent } from '../shared/product-grid/product-grid.component';
import { SeoService } from '../services/seo.service';

interface ProductVariant {
  id: number;
  name: string;
  description: string;
  frontImage?: string;
  backImage?: string;
  hasOldCoins: boolean;
  hasEuroCoins: boolean;
  showFront: boolean; // Track which side is showing
  customContent?: {
    show: boolean;
    title: string;
    items: string[];
  };
}

@Component({
  selector: 'app-products-page',
  imports: [CommonModule, IgxButtonDirective, ProductGridComponent, IgxIconModule],
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
      name: 'Вариант 1: Правоъгълна карта с българско знаме',
      description: 'Правоъгълна монетна карта с българско знаме с хоризонтални цветове отпред.',
      frontImage: '/assets/real-images/bg-cards/variant-1-front.jpg',
      backImage: '/assets/real-images/bg-cards/variant-1-back.jpg',
      hasOldCoins: true,
      hasEuroCoins: true,
      showFront: true
    },
    {
      id: 2,
      name: 'Вариант 2: Правоъгълна карта с наклонено знаме',
      description: 'Правоъгълна монетна карта с наклонено българско знаме (45 градуса).',
      frontImage: '/assets/real-images/bg-cards/variant-2-front.jpg',
      backImage: '/assets/real-images/bg-cards/variant-2-back.jpg',
      hasOldCoins: true,
      hasEuroCoins: true,
      showFront: true
    },
    {
      id: 3,
      name: 'Вариант 3: България карта с хоризонтални линии',
      description: 'България карта с форма на картата на страната с хоризонтални цветни линии.',
      frontImage: '/assets/real-images/bg-cards/variant-3-front.jpg',
      backImage: '/assets/real-images/bg-cards/variant-3-back.jpg',
      hasOldCoins: true,
      hasEuroCoins: true,
      showFront: true
    },
    {
      id: 4,
      name: 'Вариант 4: България карта с наклонени линии',
      description: 'България карта с форма на картата на страната с наклонени цветни линии.',
      frontImage: '/assets/real-images/bg-cards/variant-4-front.jpg',
      backImage: '/assets/real-images/bg-cards/variant-4-back.jpg',
      hasOldCoins: true,
      hasEuroCoins: true,
      showFront: true
    },
    {
      id: 5,
      name: 'Вариант 5: Европейски съюз Българска карта чисто синьо',
      description: 'България карта с дизайн на Европейския съюз - син фон с жълти звезди.',
      frontImage: '/assets/real-images/bg-cards/variant-5-front.jpg',
      backImage: '/assets/real-images/bg-cards/variant-5-back.jpg',
      hasOldCoins: true,
      hasEuroCoins: true,
      showFront: true
    },
    {
      id: 6,
      name: 'Вариант 6: Персонализирани Български или правоъгълни карти',
      description: 'Персонализирани карти - вие решавате дизайна, формата на картата, дали да има контурна снимка или държавно знаме отпред или отзад. Небето е границата!',
      frontImage: '/assets/real-images/bg-cards/variant-10-front.jpg',
      backImage: '/assets/real-images/bg-cards/variant-10-back.jpg',
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
      }
    },
    {
      id: 7,
      name: 'Вариант 7: Правоъгълни карти с премиум кейс',
      description: 'Персонализирани правоъгълни карти с премиум кейс за съхранение.',
      frontImage: '/assets/real-images/Variant-7-back.png',
      backImage: '/assets/real-images/Variant-7-front.png',
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
      }
    }
  ];

  public headphoneStandProductVariants: ProductVariant[] = [
    {
      id: 1,
      name: 'Стойка за слушалки',
      description: '3D принтирана стойка за слушалки с опция за отвор за касичка.',
      frontImage: '/assets/real-images/headphoneStand-back.png',
      backImage: '/assets/real-images/headphoneStand-front-2.png',
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
      }
    }
  ];

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
  const newUrl = `${window.location.origin}${window.location.pathname}#${sectionId}`;

  // 2. Update Browser URL (Visual only, no reload)
  window.history.pushState(null, '', `#${sectionId}`);

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
