# Product Grid Component

A reusable Angular component for displaying products in a grid layout with flippable image cards.

## Features

- **Responsive Grid Layout**: Automatically adjusts to screen size
- **Flippable Cards**: Front and back images with smooth 3D flip animation
- **Customizable Content**: Support for custom sections within cards
- **Image Carousel Navigation**: Buttons to flip between front and back views
- **Visual Indicators**: Dots showing which side is currently displayed
- **Action Buttons**: Customizable action buttons for each product
- **Copy-link Button**: Emits a product's `linkId` so the parent can build a shareable deep link
- **Lazy Loading**: Images are lazy-loaded for better performance

## Data model

The component is typed against the shared product model in
[`src/app/models/product.model.ts`](../../models/product.model.ts). It does **not**
define its own `Product` interface — import the model to avoid drift.

- **`Product`** — the pure data shape, stored in
  [`src/data/products.json`](../../../data/products.json) and imported at build time.
  Includes `linkId`, `hasOldCoins`/`hasEuroCoins`, the optional `featured` /
  `pageUrl` MAIN-product fields, and `customContent`/`tags`.
- **`ProductVariant`** — `Product` **plus** the runtime UI field `showFront`
  (which side of the card is visible initially). The grid tracks which cards are
  flipped locally (keyed by `id`) rather than mutating this input; `showFront`
  is deliberately **not** part of the persisted JSON data.

To add or edit a product, edit `src/data/products.json` (see
[`src/data/README.md`](../../../data/README.md)) — not this component.

## Usage

### 1. Import the Component and the model

```typescript
import { ProductGridComponent } from './shared/product-grid/product-grid.component';
import { Product, ProductVariant } from '../models/product.model';
import productsData from '../../data/products.json';

@Component({
  // ...
  imports: [ProductGridComponent, /* other imports */]
})
```

### 2. Add to Template

```html
<app-product-grid
  [products]="productVariants"
  (productAction)="handleProductAction($event)"
  (copyLink)="onCopyLink($event)">
</app-product-grid>
```

### 3. Prepare Your Data

Products are data, not code: load them from JSON and add the runtime `showFront`
flag as you map to `ProductVariant`.

```typescript
public productVariants: ProductVariant[] = (productsData as Product[]).map(
  (product) => ({ ...product, showFront: true })
);
```

### 4. Handle Product Actions

```typescript
handleProductAction(product: ProductVariant): void {
  // Handle the action (e.g., navigate to order page, open modal, etc.)
  // A MAIN product may carry its own `pageUrl` (e.g. '/gift-box') to route to
  // instead of the default /contact order-prefill flow.
  console.log('Action triggered for:', product.name);
}
```

## Properties

### Inputs

| Property   | Type               | Description                                  |
|------------|--------------------|----------------------------------------------|
| `products` | `ProductVariant[]` | Array of runtime product objects to display  |

### Outputs

| Event          | Type                        | Description                                              |
|----------------|-----------------------------|---------------------------------------------------------|
| `productAction`| `EventEmitter<ProductVariant>` | Emitted when the action button is clicked            |
| `copyLink`     | `EventEmitter<string>`      | Emits a product's `linkId` for the parent to build a link |

## Product Object Structure

See [`src/app/models/product.model.ts`](../../models/product.model.ts) for the
authoritative definition. Summary:

```typescript
interface Product {
  id: number;
  linkId: string;          // Stable slug used for #deep-links and copy-link
  name: string;
  description: string;
  frontImage?: string;
  backImage?: string;
  dateAdded?: string;      // Drives the newest/oldest sort on the products page
  hasOldCoins: boolean;
  hasEuroCoins: boolean;
  hasImagePadding?: boolean;
  featured?: boolean;      // MAIN product: pinned banner + nav child item
  pageUrl?: string;        // Own page (e.g. '/gift-box') instead of order prefill
  customContent?: { show: boolean; title: string; items: string[] };
  tags?: string[];
}

interface ProductVariant extends Product {
  showFront: boolean;      // Runtime UI state — not stored in products.json
}
```

## Styling

The component uses CSS variables from your theme. Key variables used:

- `--ig-primary-300`, `--ig-primary-500`: Primary colors (orange in default theme)
- `--ig-gray-*`: Various gray shades for borders, text, backgrounds
- `--ig-warn-*`: Warning colors for custom content sections
- `--ig-surface-*`: Surface colors for backgrounds

To customize, override these CSS variables in your theme or override the component's SCSS.

## Accessibility

- Navigation buttons include `aria-label` attributes
- Images include descriptive `alt` text
- Keyboard navigation is supported
- Semantic HTML structure

## Browser Support

- Modern browsers with CSS3 support
- 3D flip animation requires `transform-style: preserve-3d` support
- Fallback: Images will still display without animation in older browsers
