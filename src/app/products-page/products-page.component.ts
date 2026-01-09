import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IgxButtonDirective, IGX_CARD_DIRECTIVES, IgxIconComponent, IgxIconButtonDirective } from 'igniteui-angular';
import { CommonModule } from '@angular/common';

interface ProductVariant {
  id: number;
  name: string;
  description: string;
  frontImage?: string;
  backImage?: string;
  hasOldCoins: boolean;
  hasEuroCoins: boolean;
  showFront: boolean; // Track which side is showing
}

@Component({
  selector: 'app-products-page',
  imports: [CommonModule, IgxButtonDirective, IGX_CARD_DIRECTIVES, IgxIconComponent, IgxIconButtonDirective],
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
      name: 'Правоъгълна карта с българско знаме',
      description: 'Правоъгълна монетна карта с българско знаме с хоризонтални цветове отпред.',
      frontImage: '/assets/real-images/bg-cards/variant-1-front.jpg',
      backImage: '/assets/real-images/bg-cards/variant-1-back.jpg',
      hasOldCoins: true,
      hasEuroCoins: true,
      showFront: true
    },
    {
      id: 2,
      name: 'Правоъгълна карта с наклонено знаме',
      description: 'Правоъгълна монетна карта с наклонено българско знаме (45 градуса).',
      frontImage: '/assets/real-images/bg-cards/variant-2-front.jpg',
      backImage: '/assets/real-images/bg-cards/variant-2-back.jpg',
      hasOldCoins: true,
      hasEuroCoins: true,
      showFront: true
    },
    {
      id: 3,
      name: 'България карта с хоризонтални линии',
      description: 'България карта с форма на картата на страната с хоризонтални цветни линии.',
      frontImage: '/assets/real-images/bg-cards/variant-3-front.jpg',
      backImage: '/assets/real-images/bg-cards/variant-3-back.jpg',
      hasOldCoins: true,
      hasEuroCoins: true,
      showFront: true
    },
    {
      id: 4,
      name: 'България карта с наклонени линии',
      description: 'България карта с форма на картата на страната с наклонени цветни линии.',
      frontImage: '/assets/real-images/bg-cards/variant-4-front.jpg',
      backImage: '/assets/real-images/bg-cards/variant-4-back.jpg',
      hasOldCoins: true,
      hasEuroCoins: true,
      showFront: true
    },
    {
      id: 5,
      name: 'Персонализирани карти',
      description: 'Персонализирани карти - вие решавате дизайна, формата на картата, дали да има контурна снимка или държавно знаме отпред или отзад. Небето е границата!',
      frontImage: '/assets/real-images/bg-cards/variant-5-front.jpg',
      backImage: '/assets/real-images/bg-cards/variant-5-back.jpg',
      hasOldCoins: false,
      hasEuroCoins: false,
      showFront: true
    }
  ];

  constructor(private router: Router) {}

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

  public toggleCardSide(product: ProductVariant): void {
    product.showFront = !product.showFront;
  }

  public toggleToPrevious(product: ProductVariant, event: Event): void {
    event.stopPropagation();
    product.showFront = !product.showFront;
  }

  public toggleToNext(product: ProductVariant, event: Event): void {
    event.stopPropagation();
    product.showFront = !product.showFront;
  }
}
