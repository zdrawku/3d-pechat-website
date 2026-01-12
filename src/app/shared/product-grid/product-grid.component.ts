import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IgxButtonDirective, IGX_CARD_DIRECTIVES, IgxIconComponent, IgxIconButtonDirective } from 'igniteui-angular';

export interface Product {
  id: number;
  name: string;
  description: string;
  frontImage?: string;
  backImage?: string;
  showFront: boolean;
  customContent?: {
    show: boolean;
    title: string;
    items: string[];
  };
}

@Component({
  selector: 'app-product-grid',
  imports: [CommonModule, IgxButtonDirective, IGX_CARD_DIRECTIVES, IgxIconComponent, IgxIconButtonDirective],
  templateUrl: './product-grid.component.html',
  styleUrls: ['./product-grid.component.scss']
})
export class ProductGridComponent {
  @Input() products: any[] = [];
  @Output() productAction = new EventEmitter<any>();
  
  public toggleToPrevious(product: any, event: Event): void {
    event.stopPropagation();
    product.showFront = !product.showFront;
  }

  public toggleToNext(product: any, event: Event): void {
    event.stopPropagation();
    product.showFront = !product.showFront;
  }
  
  public handleAction(product: any): void {
    this.productAction.emit(product);
  }
}
