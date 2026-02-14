# AI Project Instructions

This file contains the definitive instructions and guidelines for the AI assistant working on the **3D Pechat Website**.

## 🚨 Critical Rules
1. **Sync 404.html & index.html**: Keep `404.html` in sync with `index.html`. Anytime you change `index.html` (meta tags, CSP, scripts, etc.), copy those changes to `404.html` immediately.
2. **Sitemap**: Always run `npm run generate-sitemap` after adding routes or blog posts.
3. **Images**: Always use `assets/` (no leading slash) for image paths in markdown or HTML to ensure they load correctly in all environments. Use kebab-case for filenames.
4. **Styles**: Prefer using shared styles (e.g., `src/app/blog/shared/blog-styles.scss`) over ad-hoc styling.

---

## 📝 Content Management (Blog)

### Adding New Articles
- **Workflow**:
    1. Create markdown file in `src/assets/blogs/your-slug.md`.
    2. Create images in `src/assets/blogs/images/`.
    3. Generate component in `src/app/blog/your-slug/` (TS, HTML, SCSS).
    4. Register in `src/app/services/blog.service.ts`.
    5. Add route in `src/app/app.routes.ts`.
    6. Run `npm run generate-sitemap`.

- **Naming Conventions**:
    - Slug: `kebab-case` (e.g., `best-3d-printers`).
    - Component: `PascalCase` matching slug.
    - Images: `descriptive-kebab-case.extension`.

- **SEO Requirements**:
    - **Title**: 50-60 chars, include main keyword.
    - **Description**: 150-160 chars.
    - **Canonical URL**: Always add `rel='canonical'`.
    - **Open Graph**: content type `article`, absolute URLs for images.
    - **Structured Data**: Use `addStructuredData()` method pattern in component.

*(Reference: `ARTICLE_CREATION_GUIDE.md` and `SEO_GUIDE.md`)*

---

## 🧩 Component Usage

### Product Grid (`app-product-grid`)
Reusable component for displaying products with flippable cards.
- **Location**: `src/app/shared/product-grid/`
- **Usage**:
  ```html
  <app-product-grid 
    [products]="yourProductData" 
    (productAction)="handleAction($event)">
  </app-product-grid>
  ```
- **Data Structure**: Requires `Product` interface (id, name, description, frontImage, backImage, showFront, etc.).
- **Features**: Supports custom content sections via `customContent` property.

*(Reference: `PRODUCT_GRID_QUICK_START.md`)*

### Carousel Images
Home page carousel images are dynamic.
- **Management**: Add/remove images in `src/assets/real-images/first-page-images/`.
- **Update**: Run `npm run generate-images` (or it runs auto on `start`/`build`) to update `carousel-images.ts`.
- **Formats**: jpg, png, webp, gif.

*(Reference: `CAROUSEL_IMAGES.md`)*

---

## ⚡ Performance & Optimization
- **Images**:
    - Hero: 1920x1080px, <200KB, `fetchpriority="high"`, `loading="eager"`.
    - Others: 1200px max width, <150KB, `loading="lazy"`.
    - Format: WebP preferred.
- **Caching**: `.htaccess` handles caching (1 year for static, 1 hour for HTML).
- **Build**: Use `npm run build` for production optimization (minification, tree-shaking enabled).

---

## 🛠 Project Structure & Commands
- **Start Dev**: `npm start`
- **Build Prod**: `npm run build`
- **Generate Sitemap**: `npm run generate-sitemap`
- **Lint**: `npm run lint`

### key Directories
- `src/assets/blogs/` - Markdown content
- `src/app/blog/shared/` - Shared styles
- `scripts/` - Maintenance scripts (sitemap, image generation)
