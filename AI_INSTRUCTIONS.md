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
2. **Generates article** — asks Claude through Claude Code in headless mode (`scripts/auto-blog/claude.js`; Bulgarian, SEO-optimised). Locally it uses your own Claude Code sign-in. The prompt (`scripts/auto-blog/generate-article.js`) embeds `facts` and `neverClaim` from `src/data/business.json`, and `generate-article.test.js` fails if they go missing. Review generated posts for service claims anyway.
3. **Generates cover image** — 1200×630 via Pollinations.ai (free, no key); saved to `src/assets/blogs/images/{slug}-cover.png` and converted to WebP.
4. **Files the post** (`scripts/auto-blog/scaffold-post.js`) — the markdown in `src/assets/blogs/{slug}.md` (its „Често задавани въпроси“ section wrapped in `<!-- faq -->` markers) and the entry in `blog-posts.registry.ts`. **No component or route is generated**: every post, in every language, is served by one route and one component, `src/app/blog/article/` (see below).
5. **Drafts the English version** (`scripts/auto-blog/translate-article.js`) — a second Claude call with the same `facts` / `neverClaim`, then normalised in code (links mapped to the English pages, links to Bulgarian-only posts unwrapped, H1 = title, kebab slug, ≤ 160-character description). Filed as `src/assets/blogs/en/<english-slug>.md`, the copy in `src/i18n/en/content/blog.json` and the slug in `translatedPosts` in `src/i18n/locales.json`. If it fails, the PR carries the Bulgarian post alone.
6. **Regenerates** the content maps, sitemap and llms.txt.

Override topic: set `MANUAL_TOPIC=your topic here` in `.env` before running.

**GitHub Actions** (`.github/workflows/auto-blog.yml`): runs automatically on the 1st, 11th and 21st of each month at 09:00 UTC and opens **one PR with both languages** for review (nothing is published before it is merged); supports `workflow_dispatch` with an optional `topic` input. Needs Claude Code set up for the repo (a repo secret).

**Translating an existing post:** `npm run translate-post -- <bulgarian-slug>` runs step 5 for it (needs Claude Code installed and signed in). Review the draft — facts, links, slug (permanent once published) — before committing. Details: `src/i18n/README.md` § Translating a blog post.

> ⚠️ **The scaffolder edits `blog-posts.registry.ts` by regex** (it inserts the entry before the `// Add more blog posts here` marker) and rewrites `src/i18n/locales.json` / `src/i18n/en/content/blog.json` in their own layout (`scripts/auto-blog/json-format.js`). If you reformat the registry, update `insertRegistryEntry()` in `scripts/auto-blog/scaffold-post.js` **and** `scripts/auto-blog/preflight.js`. Preflight runs first and fails fast naming the drifted file, so a format change can't waste a Claude API call and an image generation. *(Aug 2026 the pipeline broke on the routes file; Oct 2026 a comment in it was matched instead of the blog block — both impossible now: the scaffolder no longer touches `app.routes.ts`.)*

**How posts are served** (`src/app/blog/article/`):
- `article.routes.ts` — one `:slug` route per language. Its `canMatch` accepts only a post that exists in that language (registry in Bulgarian, `translatedPosts` elsewhere — an unknown slug falls through to the 404), and a resolver loads the text from that language's lazy chunk (`blog-content.generated.ts` / `blog-content.translations.generated.ts`, both generated by `npm run generate-blog-content`). `app.routes.server.ts` prerenders every post from the same lists.
- `article.component.ts` — the page: `<app-article-toolbar>` (back link + language link), the markdown, the extras, `<app-related-content>`, and one `applyBlogPostSeo(<bulgarian-slug>)` call. The router reuses it from post to post, so it follows the route's data.
- `article-extras.ts` — `ARTICLE_EXTRAS`: the few posts with a player at `<!-- video -->`, CTA buttons or a MakerWorld link. A text-only post needs nothing.

**Important conventions enforced by the generator** (maintain these manually too):
- Article markdown must **not** contain inline images (`![...](...)`). Images are added manually after review.
- Cover image asset path: `assets/blogs/images/{slug}-cover.png` (relative, no leading slash).
- The `blog-posts.registry.ts` entry must include `tags` (card labels), `keywords` (SEO) and `dateModified`.
- Every blog article must include at least 2 relevant internal links to other blog posts using root-relative paths **with the trailing slash**, such as `/blog/what-is-3d-printing/`.
- Amounts only in euro (€) — never leva (Bulgaria uses the euro since 2026). `blog-posts.registry.spec.ts` fails on an amount in leva in any language.
- An FAQ section is `## Често задавани въпроси` with `### question` + answer; wrapped in `<!-- faq -->` … `<!-- /faq -->` it becomes the page's FAQPage schema word for word.

### Adding Articles Manually
Only do this if the automated flow is unavailable:
1. Create `src/assets/blogs/your-slug.md` — no inline images in body. Wrap an FAQ section in `<!-- faq -->` … `<!-- /faq -->`.
1.5 Add at least 2 relevant internal links to other blog posts in the markdown body using root-relative blog URLs ending in `/` (e.g. `/blog/what-is-3d-printing/`). Service claims follow `src/data/business.json`.
2. Place cover image at `src/assets/blogs/images/your-slug-cover.png`.
3. Register in `src/app/services/blog-posts.registry.ts` — **include `tags`, `keywords` and `dateModified`**. Bump `dateModified` by hand whenever the post's content changes (it feeds the sitemap `lastmod`; never derive it from git — the deploy checkout is shallow).
4. That's it for the page: no component, no route. A video player, CTA buttons or a MakerWorld link → an `ARTICLE_EXTRAS` entry (`src/app/blog/article/article-extras.ts`).
5. `npm run build` (regenerates the content maps and the sitemap). Optionally `npm run translate-post -- your-slug` for the English version.

- **Naming Conventions**:
    - Slug: `kebab-case` (e.g., `best-3d-printers`), at most 80 characters.
    - Images: `descriptive-kebab-case.extension`.

- **SEO Requirements**:
    - **Title**: 50-60 chars, include main keyword.
    - **Description**: 150-160 chars.
    - **Canonical URL / Open Graph**: set by `applyBlogPostSeo`. The canonical is `https://3dpechat.bg/blog/<slug>/` (trailing slash), `og:type` is `article`, and image URLs are absolute.
    - **Structured Data**: the article component makes one call per post, `applyBlogPostSeo('<bulgarian-slug>', extras)`. It reads the registry entry (or the translation's copy on another language's page) and emits the meta tags, hreflang between the post's real versions, and a `BlogPosting` + `BreadcrumbList` `@graph`. Never hand-write `updateSeo`/`setStructuredData` for a post.
    - **Extra schema**: the component adds a `VideoObject` for a post with the featured video and a `FAQPage` read from the post's `<!-- faq -->` section — the visible text is the only source, so they can't drift.
    - **Trade-off to remember**: a post's SEO lives in its registry entry (and its translation's `blog.json` copy). To change its title, description, keywords or "updated" date, edit those. A slug missing from the registry is a 404, and a registered post without text fails the prerender on purpose.

*(Older references: `ARTICLE_CREATION_GUIDE.md` and `SEO_GUIDE.md` — where they mention per-post components or routes, this section wins.)*

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

### Info cards (icon + title + text)
The site's informative cards — home „Защо да изберете нас“ and „Как работим“, the price tiers on `/prices/` — share one layout ([approved design, variant C](https://claude.ai/artifact/4D1aY1vJzkf9Uwzg4CMeCu)): an icon (or a step number) and the title on one row, the rest below. Build new ones the same way:
- **Markup** — Ignite components only (CLAUDE.md Rule 1); imports `IGX_CARD_DIRECTIVES`, `IgxAvatarComponent`:
  ```html
  <igx-card class="feature_card">
    <igx-card-header class="feature_card_head">
      <igx-avatar class="feature_icon" [icon]="item.icon" shape="rounded" size="small" [attr.aria-hidden]="true"></igx-avatar>
      <h3 igxCardHeaderTitle class="feature_title">{{ item.title | t }}</h3>
    </igx-card-header>
    <igx-card-content class="feature_card_body">
      <p>{{ item.text | t }}</p>
    </igx-card-content>
  </igx-card>
  ```
  A numbered step puts `<igx-avatar class="step_num" shape="circle" size="small" initials="{{ i + 1 }}" [attr.aria-hidden]="true">` in the header instead (inside an `<ol>`, see the home page's process steps).
- **Styles** — the shared mixins in [`src/app/_info-card.scss`](src/app/_info-card.scss) (`@use '../info-card';`):
  ```scss
  .feature_card_head { @include info-card.head; }
  .feature_card_body { @include info-card.body; }  // ($gap: …) spaces the body's elements
  .feature_title     { @include info-card.title; }
  .feature_icon      { @include info-card.icon; }  // (secondary) = teal; ($tint: 16%) for a stronger tile
  .step_num          { @include info-card.number; }
  ```
  The card's surface — background, border, radius, shadow, the `sla-hover` effect — stays with the page: copy `.prop_card` (home) or `.tier-card` (prices).
- **Icons**: a Material icon name (`bolt`, `straighten`, `layers`, …), never an emoji. Their colours come from the avatar's own theme variables (`--igx-avatar-*`) through the mixins — no inline `bgColor` / `color`.
- **The trap**: Ignite gives every *direct* child of `igx-card-content` its body type and `margin: 0` (`.ig-typography .igx-card-content > :not(igx-icon)`), and that beats component classes. So the title goes in `igx-card-header`, never in the content, and the content's elements are spaced by the body mixin's `gap`, not margins. Elements nested one level deeper (e.g. `.tier-price > .tier-price-num`) can be styled freely.
- **Text** from `src/i18n/<lang>/*.json` through the `t` pipe (Rule 6); numbers from `business.json` (Rule 5).
- **Test**: the page's spec asserts the structure — `igx-card-header` → `igx-avatar` + `[igxCardHeaderTitle]`, then `igx-card-content` — and no emoji: see `main-page.component.spec.ts` and `prices-page.component.spec.ts`.
- **A different look** is a design change: a design artifact first (Rule 2).

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

## 📈 Analytics

GA4 property `G-YBR644GQL9`, behind the cookie consent card (below): nothing from Google loads until the visitor accepts. Page views are automatic once it loads; everything else goes through **`AnalyticsService`** (`src/app/services/analytics.service.ts`). New code calls `analytics.track('<event>', {...})` and never `gtag()` directly; the service is a no-op before consent, during prerender, in unit tests and when GA is blocked. (The YouTube `video_start` and error-handler `exception` events predate it and still call `gtag` themselves.)

| Event | Sent when | Parameters |
|-------|-----------|------------|
| `quote_click` | A link to the contact page (any language) is clicked, or the products page's „оферта“ button / the price calculator's estimate button | `cta_location` |
| `contact_click` | A `tel:`, `viber:` or `mailto:` link is clicked, anywhere | `method` (`phone` \| `viber` \| `email`), `cta_location` |
| `order_click` | A product card's „Поръчайте сега“ | `product_id` (the `linkId`), `product_name` |
| `generate_lead` | The contact form was sent (Web3Forms accepted it) | `lead_source` (`contact_form` \| `product_order` \| `price_calculator`) |
| `select_language` | The navbar switcher or a footer language link | `selected_language`, `previous_language`, `cta_location` |
| `search` | Blog search, once typing pauses for 1.5 s (2+ characters), or a tag click | `search_term`, `search_type` (`blog` \| `blog_tag`), `result_count` |

- **Links need no code.** `trackLinks()` (started by `AppComponent`) listens for clicks site-wide, so a new phone link, contact CTA or a link in blog markdown is tracked by itself. Its `cta_location` is the nearest `data-analytics-area` around it — `navbar`, `menu`, `footer`, `home_hero`, `home_video`, `home_about`, `home_cta`, `portfolio_cta`, `article`, `article_cta`, `contact_info`, `contact_form` — else `content`. A new CTA section gets its own `data-analytics-area`.
- **Buttons call `track()`** themselves; add the event and its parameters to `AnalyticsEvents` first, so the call is typed.
- **Never name a parameter after a gtag field** — `language`, `page_location`, `page_title`, `page_referrer`, `user_id`… gtag puts the value into its own field (e.g. `language` becomes the hit's browser language, `ul`), so it never arrives as a parameter and no custom dimension can read it. That's why `select_language` sends `selected_language`.
- **Renaming an event or parameter breaks the GA setup.** One-time setup in GA4 → Admin: *Key events* — `generate_lead` and `contact_click` (optionally `quote_click`, `order_click`); *Custom definitions* → event-scoped dimensions for `cta_location`, `method`, `lead_source`, `product_id`, `selected_language`, `search_type` (`search_term` is built in). Check new events in Admin → DebugView.
- **Consent** ([approved design „B“](https://claude.ai/artifact/LkW9j6L1ZpAqANj1hTKWLP)): Consent Mode v2 in **basic mode**. The inline Google tag block in `index.html` and `404.html` (keep them identical) starts every visitor with all four signals `denied` and defines `grantAnalytics()`, which grants `analytics_storage`, runs `config` and loads `gtag.js`. `ConsentService` (`src/app/services/consent.service.ts`) keeps the answer in localStorage under `consent` (`{"analytics":"granted"|"denied","at":<ms>}`) for 182 days; the inline block reads the same key to load GA on `load` for a visitor who accepted. Change the key, format or age in both places together.
  - **The card** — `app-consent-banner` (`src/app/shared/consent-banner/`): an `igx-card` in the bottom-right corner (a sheet along the bottom on phones), browser-only, two equal `igxButton="contained"` answers. The footer's „Бисквитки“ button reopens it; declining after accepting sends a `denied` update and deletes the `_ga*` cookies. The Google review snackbar waits while the card is open.
  - **Only Google Analytics needs consent.** The theme choice (localStorage), hCaptcha (loads when the visitor starts the contact form) and YouTube (click-to-play) don't. Adding anything that sets non-essential cookies (an ads pixel, a chat widget) means a second category in the card — variant D of the artifact.
  - **e2e:** `playwright.config.ts` seeds a „declined“ answer for every test, so the card stays out of screenshots and no test loads GA; `e2e/consent.spec.ts` starts without one.

### Legal pages (Privacy Policy, Terms of Use)
`/privacy/` and `/terms/` (and `/en/…`): one component, `src/app/legal-page/` ([approved design „B“](https://claude.ai/artifact/GWYULPeXsb6CdQtBUKFisy): a „Накратко“ card, a contents list, numbered sections). The site is run by a private individual, named in `business.json` → `operator` — never call it a company or firm.
- **Text**: markdown per language, `src/legal/<lang>/privacy.md` and `terms.md`. Lines before the first section are the summary points, ``- `material_icon` text``; each section is `## Title {#id}` (no number: the page numbers them). The ids are the same in every language, so `/privacy/#cookies` and `/en/privacy/#cookies` both work — the consent card links to `#cookies`.
- **Facts**: `{operator}` and `{operatorAddress}` (the operator's permanent address, which the e-commerce act asks a private individual to show), `{address}` (where the work is done), `{email}`, `{phone}`, `{freeDeliveryOver}` come from `business.json`; anything else the texts state about the service must match its `facts` (Rule 5). Prices, lead times and delivery terms are referred to the `/prices/` page and the offer rather than repeated.
- **Changing a text**: change every language, bump `dateModified` in `LEGAL_DOCS` (`legal-docs.ts`) and the four `MAIN_PAGE_LASTMOD` entries in `scripts/generate-sitemap.js`. If what is collected, by whom or for how long changes (a new tool, a longer retention), the Privacy Policy must change before the tool goes live. `legal-docs.spec.ts` checks both languages have the same sections and summary icons and that every placeholder is filled.
- **Links**: footer bottom row (Поверителност · Общи условия · Бисквитки), the consent card („Повече за данните“ → `#cookies`) and a line under the contact form's send button.
- **Third parties**: the Privacy Policy names every service that receives visitor or customer data. Adding one (a script, an embed, a font or analytics host) means adding it to the policy in both languages first. Fonts are self-hosted (`src/assets/fonts/`, CSP `font-src 'self'`) for this reason — never link Google Fonts again.

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
- **FAQ** — `src/data/faq.json` (6–10 Q&A) is rendered by `app-faq` (`src/app/shared/faq/`) on `/prices/` as always-visible `igx-card`s, mirrored as FAQPage JSON-LD via `faqPageSchema(faqFor(i18n))`, and copied into llms.txt. The English FAQ is `src/i18n/en/content/faq.json` (question and answer keyed by id; order and icons come from `src/data/faq.json`).
  - Answers may only state `business.json` facts. `src/data/faq.spec.ts` (Bulgarian) and `src/i18n/i18n.spec.ts` (other languages) fail if an answer uses a number the facts don't contain, or mentions SLA/SLS, scanning, same-day work or invoices (except "не издаваме фактури" / "we don't issue invoices").
  - Don't switch the FAQ to an accordion: collapsed answers drop out of the prerendered HTML.
- **Languages** — the main pages and the blog index exist in Bulgarian (`/…`) and English (`/en/…`); blog posts are Bulgarian, 8 of them also translated to English at `/en/blog/<english-slug>/` (how to translate one: `src/i18n/README.md` § Translating a blog post). Auto-blog posts stay Bulgarian-only. Guide: [`src/i18n/README.md`](src/i18n/README.md); plan and next steps: [`LOCALIZATION-PLAN.md`](LOCALIZATION-PLAN.md). CLAUDE.md Rule 6 has the must-follow rules.
  - `src/i18n/locales.json` lists the languages, the localized pages and the translated posts (`translatedPosts`: Bulgarian slug → English slug); routes, hreflang, the navbar switcher, the footer language links, sitemap alternates, llms.txt and the live check read it.
  - Strings: `src/i18n/<lang>/*.json`, rendered with the typed `t` pipe (`{{ 'home.hero.title' | t }}`); links with `[routerLink]="'/contact' | localizePath"`. Page meta comes from `seo.json` through `SeoService.applyPageSeo(page)`, which also sets `og:locale` and the `hreflang` set. Posts: `applyBlogPostSeo(<bulgarian-slug>)` in every language, with hreflang only between a post and its translations. One component, `src/app/blog/article/`, renders every post in every language, with `<app-article-toolbar>` (back link + language link). `<html lang>` is set by `I18nService`.
  - Numbers come from `business.json` (`pricing`, `leadTimeWorkingDays`, `rushSurchargePercent`, `maxPieceCm`, `freeDeliveryOverEur`, `fileFormats`, `replyWithinHours`, `displayAddressEn`) as `{placeholders}`. `business.spec.ts` checks that those structured values also appear in the Bulgarian `facts`.
- **Generate Blog Post**: `npm run generate-blog` (needs Claude Code installed and signed in)
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
