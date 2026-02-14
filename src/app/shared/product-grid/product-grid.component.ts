import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IgxButtonDirective, IGX_CARD_DIRECTIVES, IgxIconComponent, IgxIconButtonDirective, IgxTooltipModule } from 'igniteui-angular';

export interface Product {
  id: number;
  name: string;
  description: string;
  frontImage?: string;
  backImage?: string;
  dateAdded?: string;
  hasImagePadding?: boolean;
  showFront: boolean;
  customContent?: {
    show: boolean;
    title: string;
    items: string[];
  };
}

@Component({
  selector: 'app-product-grid',
  imports: [CommonModule, IgxButtonDirective, IGX_CARD_DIRECTIVES, IgxIconComponent, IgxIconButtonDirective, IgxTooltipModule],
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
