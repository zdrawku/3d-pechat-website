# Product Grid Component

A reusable Angular component for displaying products in a grid layout with flippable image cards.

## Features

- **Responsive Grid Layout**: Automatically adjusts to screen size
- **Flippable Cards**: Front and back images with smooth 3D flip animation
- **Customizable Content**: Support for custom sections within cards
- **Image Carousel Navigation**: Buttons to flip between front and back views
- **Visual Indicators**: Dots showing which side is currently displayed
- **Action Buttons**: Customizable action buttons for each product
- **Lazy Loading**: Images are lazy-loaded for better performance

## Usage

### 1. Import the Component

```typescript
import { ProductGridComponent } from './shared/product-grid/product-grid.component';

@Component({
  // ...
  imports: [ProductGridComponent, /* other imports */]
})
```

### 2. Add to Template

```html
<app-product-grid 
  [products]="yourProducts" 
  (productAction)="handleProductAction($event)">
</app-product-grid>
```

### 3. Prepare Your Data

```typescript
interface Product {
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

yourProducts: Product[] = [
  {
    id: 1,
    name: 'Product Name',
    description: 'Product description text',
    frontImage: '/assets/images/product-front.jpg',
    backImage: '/assets/images/product-back.jpg',
    showFront: true
  },
  {
    id: 2,
    name: 'Custom Product',
    description: 'Product with custom content',
    frontImage: '/assets/images/custom-front.jpg',
    backImage: '/assets/images/custom-back.jpg',
    showFront: true,
    customContent: {
      show: true,
      title: '✨ Customization Options:',
      items: [
        'Option 1',
        'Option 2',
        'Option 3'
      ]
    }
  }
];
```

### 4. Handle Product Actions

```typescript
handleProductAction(product: Product): void {
  // Handle the action (e.g., navigate to order page, open modal, etc.)
  console.log('Action triggered for:', product.name);
}
```

## Properties

### Inputs

| Property | Type | Description |
|----------|------|-------------|
| `products` | `any[]` | Array of product objects to display |

### Outputs

| Event | Type | Description |
|-------|------|-------------|
| `productAction` | `EventEmitter<any>` | Emitted when the action button is clicked |

## Product Object Structure

```typescript
{
  id: number;              // Unique identifier
  name: string;            // Product name (displayed in card header)
  description: string;     // Product description (displayed in card content)
  frontImage?: string;     // URL to front image
  backImage?: string;      // URL to back image
  showFront: boolean;      // Initial state (true = show front, false = show back)
  customContent?: {        // Optional custom content section
    show: boolean;         // Whether to display custom content
    title: string;         // Title for custom content section
    items: string[];       // List of items to display
  };
}
```

## Styling

The component uses CSS variables from your theme. Key variables used:

- `--ig-primary-300`, `--ig-primary-500`: Primary colors (orange in default theme)
- `--ig-gray-*`: Various gray shades for borders, text, backgrounds
- `--ig-warn-*`: Warning colors for custom content sections
- `--ig-surface-*`: Surface colors for backgrounds

To customize, override these CSS variables in your theme or override the component's SCSS.

## Example: E-commerce Products

```typescript
// In your component
products = [
  {
    id: 1,
    name: 'Premium Widget',
    description: 'High-quality widget with advanced features',
    frontImage: '/assets/products/widget-front.jpg',
    backImage: '/assets/products/widget-back.jpg',
    showFront: true
  }
];

handleProductAction(product) {
  this.router.navigate(['/checkout'], { 
    queryParams: { productId: product.id } 
  });
}
```

```html
<!-- In your template -->
<app-product-grid 
  [products]="products" 
  (productAction)="handleProductAction($event)">
</app-product-grid>
```

## Accessibility

- Navigation buttons include `aria-label` attributes
- Images include descriptive `alt` text
- Keyboard navigation is supported
- Semantic HTML structure

## Browser Support

- Modern browsers with CSS3 support
- 3D flip animation requires `transform-style: preserve-3d` support
- Fallback: Images will still display without animation in older browsers
