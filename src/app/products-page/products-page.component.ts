import { Component, DestroyRef, OnInit, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IgxButtonDirective, IgxIconModule, IgxInputGroupModule, IGX_CARD_DIRECTIVES } from 'igniteui-angular';

import { ProductGridComponent } from '../shared/product-grid/product-grid.component';
import { HappyCustomersComponent } from '../shared/happy-customers/happy-customers.component';
import { SeoService } from '../services/seo.service';
import { Product, ProductVariant } from '../models/product.model';
import productsData from '../../data/products.json';

@Component({
  selector: 'app-products-page',
  imports: [FormsModule, IgxButtonDirective, ProductGridComponent, HappyCustomersComponent, IgxIconModule, IgxInputGroupModule, IGX_CARD_DIRECTIVES],
  templateUrl: './products-page.component.html',
  styleUrls: ['./products-page.component.scss']
})
export class ProductsPageComponent implements OnInit {
  @ViewChild('grid') private grid?: ProductGridComponent;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // Products are data, not code: the catalog lives in `src/data/products.json`
  // and is imported at build time (keeps the prerendered SSR output complete for
  // SEO). `showFront` is runtime UI state the card grid toggles, so it is added
  // here rather than stored in the data. To add a product, edit the JSON (or use
  // the /add-product workflow) — no changes to this component are needed.
  public productVariants: ProductVariant[] = (productsData as Product[]).map(
    (product) => ({ ...product, showFront: true })
  );

  public searchText = '';
  // The initial selection is set here
  public sortOrder = 'newest'; 

  public get allFilteredProducts(): ProductVariant[] {
    const allProducts = [...this.productVariants];
    return this.filterAndSortProducts(allProducts);
  }

  public get resultCount(): number {
    return this.allFilteredProducts.length;
  }

  public get totalCount(): number {
    return this.productVariants.length;
  }

  public setSortOrder(order: string): void {
    this.sortOrder = order;
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
      url: 'https://3dpechat.bg/products/',
      type: 'website'
    });
    this.seoService.removeStructuredData();
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    // Deep-link support: /products#<linkId> should land on (and scroll to) the
    // matching card, even when the user arrives with a search still active or
    // follows a shared link cold. Owning this here (rather than in the grid on
    // click) fixes the prerender/hydration race — we scroll only after the list
    // has actually rendered.
    this.route.fragment
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((fragment) => {
        if (fragment) {
          this.revealSection(fragment);
        }
      });
  }

  // Emitted by the grid's copy-link button. Updates the URL via the Router
  // (keeps history coherent, and the fragment subscription handles scrolling),
  // then copies the resulting shareable URL to the clipboard.
  public async onCopyLink(linkId: string): Promise<void> {
    // Router fragment update → triggers revealSection() via the subscription.
    await this.router.navigate([], {
      relativeTo: this.route,
      fragment: linkId,
      replaceUrl: true,
    });

    const url = new URL(this.document.location.href);
    url.hash = linkId;

    // navigator.clipboard is only available in a secure context (https/localhost).
    // On plain HTTP or in some in-app browsers it's undefined — copy silently
    // fails there, but the URL bar + scroll still work, so the link is usable.
    const clipboard = this.document.defaultView?.navigator?.clipboard;
    if (clipboard) {
      try {
        await clipboard.writeText(url.href);
        this.grid?.markCopied(linkId);
      } catch {
        // User denied clipboard permission or the write failed — no-op; the
        // address bar still shows the shareable URL.
      }
    }
  }

  // Ensures the target card is rendered (clearing a conflicting search if
  // needed), then scrolls it into view. Runs after the current change-detection
  // pass so a just-cleared filter has repainted the DOM.
  private revealSection(linkId: string): void {
    const exists = this.productVariants.some((p) => p.linkId === linkId);
    if (!exists) {
      return;
    }
    // If an active search filters the target out, clear it so the card renders.
    const inCurrentResults = this.allFilteredProducts.some((p) => p.linkId === linkId);
    if (!inCurrentResults) {
      this.searchText = '';
    }

    // Defer to the next frame so the (possibly just-unfiltered) card is in the DOM.
    this.document.defaultView?.requestAnimationFrame(() => {
      const element = this.document.getElementById(linkId);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    });
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
}
