import { Component, EventEmitter, Input, Output } from '@angular/core';

import { IgxButtonDirective, IGX_CARD_DIRECTIVES, IgxIconComponent, IgxIconButtonDirective, IgxTooltipModule } from 'igniteui-angular';

import { ProductVariant } from '../../models/product.model';

@Component({
  selector: 'app-product-grid',
  imports: [IgxButtonDirective, IGX_CARD_DIRECTIVES, IgxIconComponent, IgxIconButtonDirective, IgxTooltipModule],
  templateUrl: './product-grid.component.html',
  styleUrls: ['./product-grid.component.scss']
})
export class ProductGridComponent {
  @Input() products: ProductVariant[] = [];
  @Output() productAction = new EventEmitter<ProductVariant>();
  // Emits a product's linkId when its "copy link" button is clicked. The parent
  // page owns URL/scroll/clipboard (it has the Router + platform context); this
  // component stays presentational.
  @Output() copyLink = new EventEmitter<string>();

  // linkId of the card whose copy just succeeded — drives the transient
  // "copied" checkmark on that button. Set by the parent via markCopied().
  public copiedLinkId: string | null = null;
  private copiedResetHandle: ReturnType<typeof setTimeout> | null = null;

  public toggleToPrevious(product: ProductVariant, event: Event): void {
    event.stopPropagation();
    product.showFront = !product.showFront;
  }

  public toggleToNext(product: ProductVariant, event: Event): void {
    event.stopPropagation();
    product.showFront = !product.showFront;
  }

  public handleAction(product: ProductVariant): void {
    this.productAction.emit(product);
  }

  public onCopyClick(sectionId: string): void {
    this.copyLink.emit(sectionId);
  }

  // Called by the parent once the clipboard write resolves, so the checkmark
  // only shows on real success. Auto-reverts after a short delay.
  public markCopied(sectionId: string): void {
    this.copiedLinkId = sectionId;
    if (this.copiedResetHandle) {
      clearTimeout(this.copiedResetHandle);
    }
    this.copiedResetHandle = setTimeout(() => (this.copiedLinkId = null), 2000);
  }
}
