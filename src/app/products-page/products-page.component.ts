import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IgxButtonDirective } from 'igniteui-angular';
import { CommonModule } from '@angular/common';
import { ProductGridComponent } from '../shared/product-grid/product-grid.component';

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
  imports: [CommonModule, IgxButtonDirective, ProductGridComponent],
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
      name: $localize `Вариант 1: Правоъгълна карта с българско знаме`,
      description: $localize `Правоъгълна монетна карта с българско знаме с хоризонтални цветове отпред.`,
      frontImage: '/assets/real-images/bg-cards/variant-1-front.jpg',
      backImage: '/assets/real-images/bg-cards/variant-1-back.jpg',
      hasOldCoins: true,
      hasEuroCoins: true,
      showFront: true
    },
    {
      id: 2,
      name: $localize `Вариант 2: Правоъгълна карта с наклонено знаме`,
      description: $localize `Правоъгълна монетна карта с наклонено българско знаме (45 градуса).`,
      frontImage: '/assets/real-images/bg-cards/variant-2-front.jpg',
      backImage: '/assets/real-images/bg-cards/variant-2-back.jpg',
      hasOldCoins: true,
      hasEuroCoins: true,
      showFront: true
    },
    {
      id: 3,
      name: $localize `Вариант 3: България карта с хоризонтални линии`,
      description: $localize `България карта с форма на картата на страната с хоризонтални цветни линии.`,
      frontImage: '/assets/real-images/bg-cards/variant-3-front.jpg',
      backImage: '/assets/real-images/bg-cards/variant-3-back.jpg',
      hasOldCoins: true,
      hasEuroCoins: true,
      showFront: true
    },
    {
      id: 4,
      name: $localize `Вариант 4: България карта с наклонени линии`,
      description: $localize `България карта с форма на картата на страната с наклонени цветни линии.`,
      frontImage: '/assets/real-images/bg-cards/variant-4-front.jpg',
      backImage: '/assets/real-images/bg-cards/variant-4-back.jpg',
      hasOldCoins: true,
      hasEuroCoins: true,
      showFront: true
    },
    {
      id: 5,
      name: $localize `Вариант 5: Персонализирани Български или правоъгълни карти`,
      description: $localize `Персонализирани карти - вие решавате дизайна, формата на картата, дали да има контурна снимка или държавно знаме отпред или отзад. Небето е границата!`,
      frontImage: '/assets/real-images/bg-cards/variant-5-front.jpg',
      backImage: '/assets/real-images/bg-cards/variant-5-back.jpg',
      hasOldCoins: false,
      hasEuroCoins: false,
      showFront: true,
      customContent: {
        show: true,
        title: $localize `✨ Можете да персонализирате всеки аспект:`,
        items: [
          $localize `Форма на картата`,
          $localize `Снимка или дизайн отпред/отзад`,
          $localize `Българско знаме или друг дизайн`,
          $localize `Размер и брой слотове за монети`,
          $localize `Специални гравюри или текст`
        ]
      }
    }
  ];

  constructor(private router: Router) {}

  public navigateToContact(): void {
    this.router.navigate(['/contact']);
  }

  public orderProduct(product: ProductVariant): void {
    const message = $localize `Привет, искам да поръчам "${product.name}". ${product.description}`;

    this.router.navigate(['/contact'], {
      state: {
        prefilledMessage: message,
        productName: product.name
      }
    });
  }
}
