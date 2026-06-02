# AI Project Instructions

This file contains the definitive instructions and guidelines for the AI assistant working on the **3D Pechat Website**.

## 🚨 Critical Rules
1. **Sync 404.html & index.html**: Keep `404.html` in sync with `index.html`. Anytime you change `index.html` (meta tags, CSP, scripts, etc.), copy those changes to `404.html` immediately.
2. **Sitemap**: Always run `npm run generate-sitemap` after adding routes or blog posts.
3. **Images**: Always use `assets/` (no leading slash) for image paths in markdown or HTML to ensure they load correctly in all environments. Use kebab-case for filenames.
4. **Styles**: Prefer using shared styles (e.g., `src/app/blog/shared/blog-styles.scss`) over ad-hoc styling.
5. **Component Library**: Always use **Ignite UI for Angular** components (`igx-card`, `igx-input-group`, etc.) instead of native HTML elements or other libraries whenever possible.

---

## 📝 Content Management (Blog)

### Automated Blog Generation (Preferred)
Run `npm run generate-blog` to fully automate article creation:
1. **Picks a topic** — scrapes Bulgarian 3D printing sites or falls back to `scripts/auto-blog/fallback-topics.js`.
2. **Generates article** — calls Anthropic Claude API (Bulgarian, SEO-optimised). Requires `ANTHROPIC_API_KEY` in `.env`.
3. **Generates cover image** — 1200×630 via Pollinations.ai (free, no key); saved to `src/assets/blogs/images/{slug}-cover.png`.
4. **Scaffolds all Angular files** — component TS/HTML/SCSS in `src/app/blog/{slug}/`.
5. **Registers** the post in `BlogService` and `app.routes.ts`.
6. **Regenerates sitemap** automatically.

Override topic: set `MANUAL_TOPIC=your topic here` in `.env` before running.

**GitHub Actions** (`.github/workflows/auto-blog.yml`): runs automatically Mon/Thu 9AM UTC and supports `workflow_dispatch` with an optional `topic` input. Requires `ANTHROPIC_API_KEY` repo secret.

**Important conventions enforced by the generator** (maintain these manually too):
- Article markdown must **not** contain inline images (`![...](...)`). Images are added manually after review.
- Cover image asset path: `assets/blogs/images/{slug}-cover.png` (relative, no leading slash).
- `BlogService` entry must include a `tags` array (used for card display).

### Adding Articles Manually
Only do this if the automated flow is unavailable:
1. Create `src/assets/blogs/your-slug.md` — no inline images in body.
2. Place cover image at `src/assets/blogs/images/your-slug-cover.png`.
3. Generate component in `src/app/blog/your-slug/` (TS, HTML, SCSS).
4. Register in `src/app/services/blog.service.ts` — **include `tags` array**.
5. Add route in `src/app/app.routes.ts`.
6. Run `npm run generate-sitemap`.

- **Naming Conventions**:
    - Slug: `kebab-case` (e.g., `best-3d-printers`). Slugs starting with `3d-` generate a `ThreeD` component prefix.
    - Component class: `PascalCase` matching slug (e.g., `ThreeDPrintiraniObuvkiComponent`).
    - Images: `descriptive-kebab-case.extension`.

- **SEO Requirements**:
    - **Title**: 50-60 chars, include main keyword.
    - **Description**: 150-160 chars.
    - **Canonical URL**: Always add `rel='canonical'`.
    - **Open Graph**: content type `article`, absolute URLs for images.
    - **Structured Data**: Use `setStructuredData()` in component constructor.

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
- **Generate Blog Post**: `npm run generate-blog` (requires `ANTHROPIC_API_KEY` in `.env`)
- **Lint**: `npm run lint`

### Key Directories
- `src/assets/blogs/` - Markdown content
- `src/assets/blogs/images/` - Cover images (`{slug}-cover.png`)
- `src/app/blog/shared/` - Shared styles
- `scripts/` - Maintenance scripts (sitemap, image generation)
- `scripts/auto-blog/` - Automated blog generation pipeline
