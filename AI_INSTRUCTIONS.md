# AI Project Instructions

This file contains the definitive instructions and guidelines for the AI assistant working on the **3D Pechat Website**.

## 🚨 Critical Rules
1. **Sync 404.html & index.html**: Keep `404.html` in sync with `index.html`. Anytime you change `index.html` (meta tags, CSP, scripts, etc.), copy those changes to `404.html` immediately. Exception: the `organization-jsonld` LocalBusiness block and `og:site_name` are **generated** into both files from `src/data/business.json` by `npm run generate-business-schema` (part of prebuild). Edit the JSON, never the block.
2. **Sitemap**: Always run `npm run generate-sitemap` after adding routes or blog posts. `<lastmod>` is never the build date: posts use `dateModified` from `blog-posts.registry.ts`, main pages use the hand-maintained `MAIN_PAGE_LASTMOD` map in `scripts/generate-sitemap.js`. Bump the right one whenever content really changes.
3. **Images**: Always use `assets/` (no leading slash) for image paths in markdown or HTML to ensure they load correctly in all environments. Use kebab-case for filenames.
4. **Styles**: Prefer using shared styles (e.g., `src/app/blog/shared/blog-styles.scss`) over ad-hoc styling.
5. **Component Library**: Always use **Ignite UI for Angular** components (`igx-card`, `igx-avatar`, `igxButton`, `igx-icon`, `igx-carousel`, `igx-input-group`, …) instead of native HTML elements or other libraries. This is not a "when convenient" preference — hand-rolling a plain-HTML equivalent of a component that exists is a defect, and every new component ships with a spec asserting the `igx-*` tags are present. Plain HTML is for semantics/layout only (`<section>`, `<ul>`, `<p>`, headings). **See Rule 1 in [`CLAUDE.md`](CLAUDE.md)** for the full mapping table and the two traps: the `$exclude-components` list in `src/styles.scss` (an excluded component renders unstyled) and the standalone `imports:` array (a missing entry renders the tag as an unknown element).
6. **Business facts**: every claim about what we offer comes from `src/data/business.json` (`facts`, plus `neverClaim` for what must never be said). That means FDM only, PLA stocked (other materials bought per order), the price per 10 g and 3 € minimum, lead times, delivery, payment and hours. This applies to page copy, blog posts, product descriptions, FAQ and llms.txt. **See Rule 5 in [`CLAUDE.md`](CLAUDE.md).** Blog posts may *explain* SLA/SLS/scanning as technology, but never present them as our service.

---

## 📝 Content Management (Blog)

### Automated Blog Generation (Preferred)
Run `npm run generate-blog` to fully automate article creation:
1. **Picks a topic** — first the **buyer-intent backlog** in `scripts/auto-blog/service-topics.js` (pre-order questions such as price, spare parts, modeling from a photo, file formats), in order, until each is published. Each has a fixed `slug` that the generator keeps, so the dedupe stays exact. Then it scrapes Bulgarian 3D printing sites (current ideas). If nothing fresh comes back it uses catalog-related topics from `scripts/auto-blog/product-topics.js` (gifts, stands, organizers, coin cards… — the prompt then steers the article to `/products/`), and finally the generic `scripts/auto-blog/fallback-topics.js`.
2. **Generates article** — calls Anthropic Claude API (Bulgarian, SEO-optimised). Requires `ANTHROPIC_API_KEY` in `.env`. The prompt (`scripts/auto-blog/generate-article.js`) embeds `facts` and `neverClaim` from `src/data/business.json`, and `generate-article.test.js` fails if they go missing. Review generated posts for service claims anyway.
3. **Generates cover image** — 1200×630 via Pollinations.ai (free, no key); saved to `src/assets/blogs/images/{slug}-cover.png`.
4. **Scaffolds all Angular files** — component TS/HTML/SCSS in `src/app/blog/{slug}/`. The template ends with `<app-related-content slug="{slug}">` (3 related articles + 3 catalog products, chosen automatically from tags/title — see `src/app/shared/related-content/`).
5. **Registers** the post in `blog-posts.registry.ts` and `app.routes.ts`. The scaffolded component calls `applyBlogPostSeo('<slug>')`.
6. **Regenerates sitemap** automatically.

Override topic: set `MANUAL_TOPIC=your topic here` in `.env` before running.

**GitHub Actions** (`.github/workflows/auto-blog.yml`): runs automatically on the 1st, 11th and 21st of each month at 09:00 UTC, opens a PR for review, and supports `workflow_dispatch` with an optional `topic` input. Requires `ANTHROPIC_API_KEY` repo secret.

> ⚠️ **The scaffolder edits `app.routes.ts` and `blog-posts.registry.ts` by regex, so it is coupled to their formatting.** Blog routes are **lazy** — `{ path: '<slug>', loadComponent: () => import('./blog/<slug>/<slug>.component').then(m => m.<Class>) }` — with **no static `import … from './blog/…'` lines** (adding one would pull the chunk into the main bundle and defeat lazy loading). If you reformat either file, update `updateRoutes()`/`updateBlogService()` in `scripts/auto-blog/scaffold-component.js` **and** the anchors in `scripts/auto-blog/preflight.js`. Preflight runs first and fails fast naming the drifted file, so a format change can no longer waste a Claude API call and an image generation before dying. *(This is exactly what broke the pipeline in Aug 2026: the routes had migrated to `loadComponent` while the scaffolder still looked for static imports.)*

**Important conventions enforced by the generator** (maintain these manually too):
- Article markdown must **not** contain inline images (`![...](...)`). Images are added manually after review.
- Cover image asset path: `assets/blogs/images/{slug}-cover.png` (relative, no leading slash).
- The `blog-posts.registry.ts` entry must include `tags` (card labels), `keywords` (SEO) and `dateModified`.
- Every blog article must include at least 2 relevant internal links to other blog posts using root-relative paths **with the trailing slash**, such as `/blog/what-is-3d-printing/`.

### Adding Articles Manually
Only do this if the automated flow is unavailable:
1. Create `src/assets/blogs/your-slug.md` — no inline images in body.
1.5 Add at least 2 relevant internal links to other blog posts in the markdown body using root-relative blog URLs ending in `/` (e.g. `/blog/what-is-3d-printing/`). Service claims follow `src/data/business.json`.
2. Place cover image at `src/assets/blogs/images/your-slug-cover.png`.
3. Generate component in `src/app/blog/your-slug/` (TS, HTML, SCSS) — import `RelatedContentComponent` and put `<app-related-content slug="your-slug">` after the `</article>` (copy any existing post's template).
4. Register in `src/app/services/blog-posts.registry.ts` — **include `tags`, `keywords` and `dateModified`**. Bump `dateModified` by hand whenever the post's content changes (it feeds the sitemap `lastmod`; never derive it from git — the deploy checkout is shallow).
5. Add route in `src/app/app.routes.ts`.
6. Run `npm run generate-sitemap`.

- **Naming Conventions**:
    - Slug: `kebab-case` (e.g., `best-3d-printers`). Slugs starting with `3d-` generate a `ThreeD` component prefix.
    - Component class: `PascalCase` matching slug (e.g., `ThreeDPrintiraniObuvkiComponent`).
    - Images: `descriptive-kebab-case.extension`.

- **SEO Requirements**:
    - **Title**: 50-60 chars, include main keyword.
    - **Description**: 150-160 chars.
    - **Canonical URL / Open Graph**: set by `applyBlogPostSeo`. The canonical is `https://3dpechat.bg/blog/<slug>/` (trailing slash), `og:type` is `article`, and image URLs are absolute.
    - **Structured Data**: the component constructor makes one call, `this.seoService.applyBlogPostSeo('<slug>')`. It reads the post's registry entry and emits the meta tags plus a `BlogPosting` + `BreadcrumbList` `@graph`. Don't hand-write `updateSeo`/`setStructuredData` in post components.
    - **Extra schema** for one post (a visible FAQ, a video) goes in the second argument: `applyBlogPostSeo(slug, { graph: [faqPageSchema(FAQ), videoObjectSchema(video)], article: { video: { '@id': … } } })`. `faqPageSchema` lives in `seo.service.ts`. Keep the visible FAQ text and the `FAQ` array identical; the spec checks it. See `monetna-karta-bulgarski-evro-moneti` and `3d-pechat-po-porachka-sofia-video`.
    - **Trade-off to remember**: a post's SEO is not visible in its component. To change its title, description, keywords or "updated" date, edit its registry entry. A slug missing from the registry fails the prerender on purpose.

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

### YouTube video (`app-youtube-embed`)
Click-to-play player for our YouTube videos (home „Вижте ни в действие“ section, video blog article).
- **Location**: `src/app/shared/youtube-embed/` (component + `video.util.ts`).
- **Data**: `src/data/videos.json` (see `src/data/README.md`). `FEATURED_VIDEO` is the one with `featured: true`.
- **Usage**: `<app-youtube-embed [video]="video"></app-youtube-embed>`.
- **Behaviour**: renders only the self-hosted poster until play is pressed, then swaps in a `youtube-nocookie.com` iframe. No YouTube request on page load, fixed 16:9 box, GA4 `video_start` event.
- **Structured data**: `videoObjectSchema(video)` returns a `VideoObject`. On a blog post, pass it through `applyBlogPostSeo(slug, { graph: [...] })`; on other pages use `SeoService.setStructuredData()` (the home page does).
- **Never** put an `<iframe>` in blog markdown: ngx-markdown sanitises it away. Split the markdown at a `<!-- video -->` marker and place the component in the template (see `3d-pechat-po-porachka-sofia-video`).
- **CSP**: `youtube-nocookie.com` is the only YouTube host in `frame-src` (`index.html` + `404.html`).
- **Product cards**: a product that appears in a video gets a `links` entry `{ "label": "Виж във видеото", "url": "https://youtu.be/<id>?t=<seconds>", "icon": "play_circle" }` (guarded by the products-page spec).

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
- **Generate LocalBusiness schema**: `npm run generate-business-schema` (from `src/data/business.json`, in prebuild)
- **IndexNow (Bing)**: `npm run indexnow -- --sitemap src/sitemap.xml --dry-run`. The deploy workflow runs it after every deploy for new/changed URLs; trigger the workflow manually with `indexnow_all` to resubmit everything.
- **Live site check**: `npm run check:live`. It's a read-only crawl of https://3dpechat.bg covering crawler access (Googlebot, bingbot, OAI-SearchBot, PerplexityBot, ClaudeBot…), the schema vs `business.json`, every sitemap URL, redirects, llms.txt, the IndexNow key, the FAQ, and `lang` + `hreflang` on every page in every language. `.github/workflows/live-site-check.yml` runs it every Monday; run it by hand ~10 minutes after a deploy.

### FAQ and languages
- **FAQ** — `src/data/faq.json` (6–10 Q&A) is rendered by `app-faq` (`src/app/shared/faq/`) on `/prices/` as always-visible `igx-card`s, mirrored as FAQPage JSON-LD via `faqPageSchema(faqFor(i18n))`, and copied into llms.txt. The English FAQ is `src/i18n/en/content/faq.json` (same ids and order).
  - Answers may only state `business.json` facts. `src/data/faq.spec.ts` (Bulgarian) and `src/i18n/i18n.spec.ts` (other languages) fail if an answer uses a number the facts don't contain, or mentions SLA/SLS, scanning, same-day work or invoices (except "не издаваме фактури" / "we don't issue invoices").
  - Don't switch the FAQ to an accordion: collapsed answers drop out of the prerendered HTML.
- **Languages** — the main pages exist in Bulgarian (`/…`) and English (`/en/…`); the blog stays Bulgarian. Guide: [`src/i18n/README.md`](src/i18n/README.md); plan and next steps: [`LOCALIZATION-PLAN.md`](LOCALIZATION-PLAN.md). CLAUDE.md Rule 6 has the must-follow rules.
  - `src/i18n/locales.json` lists the languages and the localized pages; routes, hreflang, the navbar switcher, the footer language links, sitemap alternates, llms.txt and the live check read it.
  - Strings: `src/i18n/<lang>/*.json`, rendered with the typed `t` pipe (`{{ 'home.hero.title' | t }}`); links with `[routerLink]="'/contact' | localizePath"`. Page meta comes from `seo.json` through `SeoService.applyPageSeo(page)`, which also sets `og:locale` and the `hreflang` set (none on the blog). `<html lang>` is set by `I18nService`.
  - Numbers come from `business.json` (`pricing`, `leadTimeWorkingDays`, `rushSurchargePercent`, `maxPieceCm`, `freeDeliveryOverEur`, `fileFormats`, `replyWithinHours`, `displayAddressEn`) as `{placeholders}`. `business.spec.ts` checks that those structured values also appear in the Bulgarian `facts`.
- **Generate Blog Post**: `npm run generate-blog` (requires `ANTHROPIC_API_KEY` in `.env`)
- **Lint**: `npm run lint`
- **Script unit tests**: `npm run test:scripts` (node's built-in runner, `scripts/**/*.test.js`)

### Internal links, redirects, renames
- Internal links use the canonical **trailing-slash** form (`/blog/slug/`). `generate-blog-content.js` normalises markdown links on every build, and `scripts/check-internal-links.js` (the `postbuild` script) fails the build on any slash-less internal `href` or any `www`/`http` 3dpechat.bg URL in `dist/**/index.html`.
- GitHub Pages has no server redirects. When a post is renamed or merged, delete/rename it and add a route for the **old path** using `LegacyRedirectComponent` (`data: { to: '/blog/<new>/' }`, see `app.routes.ts`), then record it in `LEGACY_REDIRECTS.md`. Never remove these routes.
- `BlogService` bundles every article body; **don't import it from code that runs on every page** (e.g. `SeoService`). Post metadata lives in the content-free `blog-posts.registry.ts` for that reason.

### Key Directories
- `src/assets/blogs/` - Markdown content
- `src/assets/blogs/images/` - Cover images (`{slug}-cover.png`)
- `src/app/blog/shared/` - Shared styles
- `scripts/` - Maintenance scripts (sitemap, image generation)
- `scripts/auto-blog/` - Automated blog generation pipeline
