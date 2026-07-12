# Lighthouse Improvement Plan — target 100/100/100/100

Baseline: Lighthouse 13.3.0, **desktop** preset, run against the production site (GitHub Pages).
Reports are analyzed per page; most fixes below are **site-wide** and will lift every page at once.

## Page report tracker

| Page | Perf | A11y | Best Practices | SEO | Status |
|---|---|---|---|---|---|
| `/blog/` | 73 | 94 | 100 | 100 | Analyzed (2026-07-10) |
| `/blog/infill-pri-3d-pechat-platnost-zdravina-i-filament` | — | — | — | — | Lighthouse run errored — see §4 |
| `/products/` | 82 | 90 | 100 | 100 | Analyzed (2026-07-12), **dark theme** run — see §6 |
| *(remaining pages)* | | | | | Pending reports |

## How the Performance score is computed (what actually moves it)

Only 5 metrics are scored: **TBT 30%, LCP 25%, CLS 25%, FCP 10%, SI 10%**. Everything under
"Diagnostics"/"Insights" (cache TTL, unused CSS, image savings…) has **weight 0** — it matters only
insofar as it moves those 5 metrics.

`/blog/` today: TBT 20 ms ✅ · CLS 0 ✅ · **FCP 1.7 s (0.42) ❌ · LCP 3.3 s (0.27) ❌ · SI 1.7 s (0.73) ❌**.
To hit 100 we need roughly FCP < 0.95 s, LCP < 1.2 s, SI < 1.3 s (desktop thresholds). Every fix below
is chosen to pull FCP/LCP/SI down.

---

## 1. Performance — site-wide workstreams (ordered by impact)

### P1. Stop lazy-loading the LCP image; add priority hints
**File:** `src/app/blog-list-page/blog-list-page.component.html:45`
Every card cover has `loading="lazy"` — including the first, above-the-fold card, which **is the LCP
element**. Lighthouse measured a simulated LCP load delay of ~2.1 s purely from delayed discovery.

- First 2–4 cards (above the fold): `loading="eager"` + `fetchpriority="high"` on the first one;
  keep `loading="lazy"` for the rest (use `$index` in the `@for`).
- Preferred implementation: switch the covers to `NgOptimizedImage` (`ngSrc`, `priority` on the first
  card, `width`/`height`) — it emits the preload hint and enforces best practice automatically.
- Audit the other pages' hero/carousel images for the same pattern when their reports arrive
  (`main-page`, `portfolio`, blog article covers).

**Expected:** the single biggest LCP win on `/blog/` (est. −1.5 to −2 s LCP).

### P2. Enable client hydration
**File:** `src/app/app.config.ts`
The site is fully prerendered (`outputMode: "static"`) but there is **no `provideClientHydration()`**,
so Angular throws away the server-rendered DOM and re-renders everything client-side. That is where a
large part of the 226 ms element-render-delay + main-thread work comes from, and it re-triggers
image/layout work after JS loads.

```ts
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
// providers:
provideClientHydration(withEventReplay()),
```
- Remove `importProvidersFrom(BrowserModule)` (redundant with `bootstrapApplication` and incompatible
  with hydration). Keep `HammerModule` only if still needed (see P6).
- Verify no hydration-mismatch console errors on every route afterwards (`ng serve` + browser console,
  then a full prerender build).

### P3. Shrink the 815 KB CSS bundle (89 % unused)
**File:** `src/styles.scss:28`
`@include theme($palette: …)` emits themes for **every** Ignite UI component. Coverage shows ~600 KB
of the 673 KB stylesheet unused on `/blog/`.

- Inventory the Ignite UI components actually used across the app (navbar, card, button, icon,
  input-group, ripple, carousel, expansion panel, snackbar… grep `Igx*Module` imports).
- Use the theming API to include only those: either individual component-theme mixins, or
  `@include theme($palette…, $exclude: (...))` with the full list of unused components.
- Keep `inlineCritical: true` (already on).

**Expected:** CSS ≈ 815 KB → well under 150 KB; faster FCP/SI (style/layout was 136 ms of main-thread)
and −650 KB page weight.

### P4. Lazy-load routes to shrink main.js (1.67 MB)
**File:** `src/app/app.routes.ts`
All 19 page components are statically imported, so the blog list downloads the markdown renderer,
carousel, contact form, hCaptcha glue, etc. up front.

- Convert every route to `loadComponent: () => import('…').then(m => m.XComponent)`.
- This pushes `ngx-markdown` (marked) and per-page Ignite UI modules out of the initial bundle.
- Re-check the bundle after: `ng build` prints chunk sizes; initial JS should drop dramatically.

### P5. Kill the trailing-slash redirect + make canonicals consistent
The audit hit `https://3dpechat.bg/blog` → **301** → `/blog/` (+143 ms observed, −FCP/LCP). GitHub
Pages forces the redirect for directory-style prerendered routes; you cannot remove the 301, so make
every reference use the trailing-slash form:
- `SeoService` canonical/og:url values (e.g. `blog-list-page.component.ts:38` uses
  `https://3dpechat.bg/blog` — should be `…/blog/`; same for every blog post component).
- `scripts/generate-sitemap.js` output and `src/sitemap.xml`.
- Any external links/ads/GSC property settings you control.
- **Always run Lighthouse against the trailing-slash URL** — otherwise the redirect is billed to the
  page score even after all other fixes.

### P6. Fonts: self-host and set font-display
**File:** `src/index.html:57-58`
Roboto + Material Icons come from Google Fonts with no `font-display` (flagged, ~40 ms FCP) and add a
third-party connection chain (257 KB).
- Best: self-host both as woff2 in `src/assets/fonts` with `@font-face { font-display: swap }`
  (icons: `font-display: block` to avoid ligature-text flashes). Subset Roboto to 300/400/600/700
  latin+cyrillic. Then drop the two `<link>`s and the fonts.googleapis/fonts.gstatic CSP entries.
- Longer-term (optional): replace the Material Icons ligature font (128 KB for a handful of glyphs)
  with inline SVG icons — Ignite UI's `igx-icon` supports SVG registration.
- Related: `hammer.min.js` is loaded globally (`angular.json` scripts) — verify the carousel still
  needs it; if only used on one page, consider dropping `HammerModule` + the script (−20 KB).

### P7. Optimize blog cover images (912 KB savings flagged)
The webp migration commit missed the `assets/blogs/images/` covers:
- `3d-printirani-obuvki-cover-3.png` — 607 KB, 1613×601 rendered at ~725×291 → resize + WebP ≈ 30–50 KB.
- `Bambu-Lab-X2D.jpg` — 196 KB, oversized → resize + WebP.
- All remaining `*-cover.jpg` → WebP (sharp is already a devDependency; extend
  `scripts/generate-carousel-images.js` or add a `generate-blog-images` script so future covers are
  converted automatically). Optionally emit `srcset` sizes if using NgOptimizedImage (P1).

### P8. Defer Google Tag Manager / gtag (optional, recommended)
**File:** `src/index.html:19`
gtag.js is 486 KB (159 KB unused) and competes for bandwidth during load. TBT is currently fine, so
this is a bandwidth/SI win, and insurance for the harsher **mobile** run:
- Inject the gtag script on `window.load` (or first user interaction) instead of a static `<head>` tag.

### P9. Hosting/caching (infrastructure, weight-0 but real-world)
GitHub Pages serves everything with `Cache-Control: max-age=600` and **ignores `src/.htaccess`**
(Apache-only — it currently ships as dead weight in the deploy). The flagged "3,408 KiB cache savings"
cannot be fixed on GH Pages.
- Option A (keep GH Pages): put Cloudflare (free) in front — cache rules for immutable hashed assets,
  HTTP/3, and it also lets you add HSTS/COOP/X-Frame-Options headers (currently informational-only
  flags in Best Practices).
- Option B: move to Cloudflare Pages/Netlify where `_headers` gives full control.
- Either way, delete `.htaccess` from `angular.json` assets or keep it only if you ever move to Apache.

---

## 2. Accessibility 94 → 100 (`/blog/`, mostly site-wide)

Two scored failures: **color-contrast** (weight 7) and **heading-order** (weight 3).

### A1. Color contrast (all need ≥ 4.5:1 on the #F5F5F5 surface)
| Element | File | Current | Ratio | Suggested fix |
|---|---|---|---|---|
| Navbar links `.button_home` (green text) | theme `$secondary` `src/styles.scss:11` + `app.component.scss:350` | `#4CAF50` | 2.54 | `#2E7D32` (≈4.7:1). Either darken `$secondary` in the palette or override `.button_home` color directly. |
| "ПРОЧЕТИ ПОВЕЧЕ" span | `blog-list-page.component.scss:179` | `#667EEA` | 3.35 | `#4F46E5` (≈5.8:1) keeps the violet-blue look. Check the matching gradient at lines 91/154 for tag chips (white text on gradient is fine, but re-verify). |
| `article` icon in read-more button | inherits theme secondary | `#4CAF50` | 2.54 | fixed by the `$secondary`/button override above |
| Card date + calendar icon | `blog-list-page.component.scss:125` | `#7F8C8D` | 3.18 | `#5C6B6C` (≈5.1:1) |
| Footer icons `.icon_mail_footer` | `app.component.scss:330` | `#8A8A8A` | 3.16 | `#666666` (≈5.3:1) |

Re-verify each value with a contrast checker after applying (and spot-check the dark theme, which has
its own palette in `styles.scss`).

### A2. Heading order
**File:** `blog-list-page.component.html:54-58`
Page is `h1` → card `h3` → card `h5` (two skips, flagged on every card).
- Card title: `h3` → `h2`.
- Date subtitle: it's not a heading at all — change `h5` → `span`/`p` (the `igxCardHeaderSubtitle`
  directive works on any element).
- When the article-page reports arrive, verify markdown content starts at `h1` and descends without
  skips (the auto-blog generator should enforce this).

---

## 3. Best Practices & SEO (both already 100 on `/blog/`)

Keep them green; watch these weight-0 items that could be scored in future Lighthouse versions:
- **Missing source map** for `main-*.js` — either ship production source maps (`"sourceMap": { "scripts": true, "hidden": true }`) or accept the informational flag.
- **CSP `unsafe-inline`/`unsafe-eval`** in `index.html` — required today by Angular/GTM/hCaptcha; revisit if moving to nonce-based CSP.
- **HSTS / COOP / frame-ancestors** — only possible with a host that lets you set headers (see P9).

---

## 4. Investigation: `/blog/infill-pri-3d-pechat-platnost-zdravina-i-filament` Lighthouse error

Everything in the pipeline for this post checks out:
- Route registered: `app.routes.ts:48`; server route prerenders `**` (`app.routes.server.ts`).
- Markdown exists (`src/assets/blogs/infill-….md`) and is bundled at build time
  (`blog-content.generated.ts` → key `infill-pri-3d-pechat-platnost-zdravina-i-filament`), so no
  runtime fetch can fail; `BlogService.getPost` would have failed the **build**, not the page.
- Fetched the live URL (2026-07-10): returns the full prerendered article, correct title/SEO tags,
  no error content. **The page itself is healthy — the markdown pipeline is not broken.**

So the Lighthouse failure was environmental. Likely candidates, in order:
1. **`GlobalErrorHandlerService` navigates to `/error` on ANY uncaught error** in production
   (`global-error-handler.service.ts:17`). If any transient script error fires mid-audit (gtag,
   ripple, hammer…), the page navigates away and Lighthouse aborts with a "page navigated/changed URL"
   error. → Recommended hardening: log the error (and optionally report to GA) but **do not
   auto-navigate** for non-fatal errors.
2. Trailing-slash 301 (audited URL without `/`) combined with DevTools throttling can occasionally
   produce `NO_FCP`/`PROTOCOL_TIMEOUT` on heavier pages.
3. Browser-extension interference if run from a normal (non-incognito) DevTools session.

**Action:** re-run in an incognito window against
`https://3dpechat.bg/blog/infill-pri-3d-pechat-platnost-zdravina-i-filament/` (trailing slash). If it
still errors, capture the exact error string and add it here.

---

## 5. Implementation order & expected impact

| # | Task | Effort | Expected effect on `/blog/` |
|---|---|---|---|
| 1 | P1 LCP image eager + fetchpriority (NgOptimizedImage) | S | LCP 3.3 s → ~1.3 s |
| 2 | P2 Client hydration | S | −200 ms+ render delay, less CPU, all pages |
| 3 | P5 Trailing-slash canonicals + test URLs | S | −220 ms FCP/LCP on every scored run |
| 4 | P3 Ignite UI theme slimming | M | −650 KB CSS → faster FCP/SI |
| 5 | P4 Route-level code splitting | M | main.js 1.67 MB → likely < 500 KB initial |
| 6 | A1 + A2 contrast & headings | S | A11y 94 → 100 |
| 7 | P6 Self-host fonts | M | −40 ms FCP, −3rd-party chain |
| 8 | P7 Blog cover WebP pipeline | S | −900 KB weight, helps mobile LCP |
| 9 | P8 Defer gtag | S | −486 KB during load (mobile insurance) |
| 10 | P9 Cloudflare/headers | M (infra) | repeat-visit speed, security headers |
| 11 | §4 Error-handler hardening | S | prevents audit aborts + real UX bug |

**Verification protocol** (after implementation):
```bash
npm run build
npx http-server dist/dprinting-services-website/browser -p 8080
npx lighthouse http://localhost:8080/blog/ --preset=desktop --view
npx lighthouse http://localhost:8080/blog/ --view   # mobile default — also target 100 here
```
Then re-run against production URLs (trailing slash!) after deploy. Repeat for every page in the
tracker table.


---

# 6. `/products/` run — 2026-07-12 (dense-design regression)

Scores: **Perf 82 · A11y 90 · BP 100 · SEO 100**. Report banner confirms the audit hit
`https://3dpechat.bg/products` → 301 → `/products/` (150 ms billed to the page — always audit the
trailing-slash URL, see P5).

**Theme context (important):** the audit rendered the **dark theme** (screenshot thumbnails are dark).
Theme selection follows `prefers-color-scheme` when no saved preference exists
(`app.component.ts:33-41`), so *both* themes ship to first-time visitors — every color fix below must
pass 4.5:1 in **both** palettes. Contrast is checked only against whatever theme the audited page
renders, so verify each theme with a separate run (DevTools → Rendering → emulate
`prefers-color-scheme` light/dark, in incognito so no `localStorage.theme` is set). No second planning
pass needed — the fixes are token-based; only re-run to *verify*.

Prior-plan carry-overs already done ✅: hydration (P2), lazy routes (P4), theme slimming (P3, unused
CSS now 149 KiB), deferred gtag (P8), WebP product images, hammer removed. Still open: fonts (P6),
hosting/cache (P9), trailing-slash audit discipline (P5).

## 6A. Accessibility 90 → 100 (three scored failures)

### A3. Color contrast — the orange CTA system fails in both themes
Root cause: **white text on brand orange**. Measured ratios (WCAG relative luminance):
- white on `#FF5722` (light `$primary`) ≈ **3.1:1** ❌
- white on `#FF7043` (dark `--ig-primary-500`) ≈ **2.7:1** ❌
- white on `#FF8A65` (`--ig-primary-400`, the *lighter gradient stop* used on CTAs) ≈ **2.2:1** ❌

Affected elements (all use `--ig-primary-400/500` + white):
| Element | File | Notes |
|---|---|---|
| Card CTA "ПОРЪЧАЙТЕ СЕГА" | `src/app/shared/product-grid/product-grid.component.scss:339` `.contact-button` | gradient 400→500, `color:#fff` |
| Navbar "Заяви оферта" | `src/app/app.component.scss:619` `.nav_cta_button` | same gradient pattern |
| Active sort pill | `src/app/products-page/products-page.component.scss:71` `.sort-option.active` | solid `--ig-primary-500` + `#fff` |
| Tag chips | `src/app/shared/product-grid/product-grid.component.scss:255` `.product-tag` | `--ig-primary-500` text on 12% tint — light theme ≈ **2.6:1** ❌, dark ≈ 4.5:1 borderline |
| Sweep for the same pattern | `.page-banner__eyebrow` (`styles.scss:251`), `.empty-state-icon`, `.carousel-nav` icon (orange on white ≈ 3.1 ❌ but ≥24 px icon may count as graphics, fix anyway), `.info-btn` (`--ig-warn-700` on warn tint — verify) | grep `--ig-primary-500` used as *text/icon color* |

**Fix strategy — introduce CTA tokens instead of touching the palette** (the palette drives too much;
scoped tokens keep the visual identity). In `styles.scss` `:root` and `.dark-theme`:

```scss
:root {
  --cta-bg:    #BF360C;  // deep-orange 800 — white on it ≈ 5.6:1 ✓
  --cta-bg-2:  #C13A0B;  // lighter gradient stop — white on it ≈ 5.4:1 ✓ (do NOT use #D84315: 4.4:1 ❌)
  --cta-fg:    #FFFFFF;
  --tag-fg:    #A83208;  // on the 12% orange tint ≈ 5.4:1 ✓
}
.dark-theme {
  // Option B (recommended): keep the bright brand orange, flip the text dark —
  // same pattern the palette already uses for teal ($secondary contrast #00201D).
  --cta-bg:    #FF7043;
  --cta-bg-2:  #FF8A65;
  --cta-fg:    #1A1A1A;  // ≈ 6.3:1 on #FF7043 ✓ (verify on the #FF8A65 stop too ✓ ≈ 7.6:1)
  --tag-fg:    #FF8A65;  // on dark 12% tint ≈ 5.3:1 ✓
}
```
Then swap `.contact-button`, `.nav_cta_button`, `.sort-option.active`, `.product-tag` to the tokens
(`background: linear-gradient(135deg, var(--cta-bg-2), var(--cta-bg) 70%); color: var(--cta-fg);`).
If dark-on-orange CTAs are visually unacceptable in dark mode, fall back to Option A: use the light
tokens in both themes (white on `#BF360C` works on the near-black ground too). Re-verify every pair
with a contrast checker after the change — the numbers above are computed, not measured in-browser.

### A4. Touch targets (WCAG 2.5.8 — ≥24×24 CSS px, or adequate spacing)
Confirm the exact list by expanding the audit row (or export the report JSON), but these are the
probable offenders on `/products/`:
| Target | File | Problem → fix |
|---|---|---|
| Search **clear** icon | `products-page.component.html:15` | bare `igx-icon` with `(click)`, ~18 px → wrap in a real `<button type="button" aria-label="Изчисти търсенето">` with ≥32×32 hit area |
| `+N` tags chip | `product-grid.component.html:73` `.product-tag-more` | ~18 px tall `span` with tooltip trigger → make it a `<button>` min 24×24 (pad vertically) |
| `.info-btn` / `.copy-link-btn` pair | `product-grid.component.scss:212`, `styles.scss:397` | 28 px targets 6 px apart → bump both to ≥32×32, keep ≥8 px gap |
| Footer link stack | `app.component.html:172-199` `.footer_link` | line-height-only rows stacked tightly → `padding: 6px 0; display: inline-block;` (≥24 px row height + spacing) |
| Carousel nav / sort pills | 34 px / ~31 px | already ≥24 — leave unless flagged |

**Density-preserving trick:** grow the *hit area*, not the visual: transparent `::after` inset
expansion (`position:absolute; inset:-8px;` on a relative button) or padding + negative margin.
The layout stays exactly as dense as it is now.

### A5. Heading order
- `products-page.component.html:46` — the section `h2` renders **only while searching**, so the
  default view is `h1` → card `h3` (skip). Fix: always render an `h2` for the catalog section
  (e.g. `<h2 class="visually-hidden">Каталог</h2>` or a visible one above the grid); keep card
  titles `h3`. Add a global `.visually-hidden` utility in `styles.scss` if missing.
- `product-grid.component.html:41-44` — the tooltip `<div>` is nested **inside** the `<h3>`. Move it
  out as a sibling (the `igxTooltipTarget` span stays inside). Invalid heading content can also
  confuse the audit.
- Features/CTA sections (`h2` → `h3`) are fine once the catalog `h2` exists.

## 6B. Performance 82 → 95+

### P10. LCP request discovery — first-row card images are lazy-loaded
`product-grid.component.html:12,16` puts `loading="lazy"` on **every** card image; the LCP element is
a first-row card image (this is exactly the `/blog/` P1 bug reappearing in the new grid).
- Track index in the `@for` (`track product; let i = $index`).
- First 4 cards (one desktop row): front image `loading="eager"`, and `fetchpriority="high"` on
  card 0. **Back images stay lazy always** (hidden behind the flip).
- Grid is prerendered + hydrated, so the eager images are discoverable in the initial HTML — this
  directly fixes both "LCP request discovery" and part of "Network dependency tree".

### P11. Image delivery (−722 KiB) + enormous payload (2,899 KiB)
Product photos are full-resolution 300–800 KiB WebP files rendered at ~240×170 (`src/assets/real-images/`
is **46 MB**). They're already WebP — the problem is *dimensions*, so:
- New `scripts/generate-product-thumbs.js` (sharp is already a devDependency; mirror
  `generate-carousel-images.js`): emit 320/480/768-wide variants next to the originals
  (e.g. `name.480.webp`), wired into `prebuild`.
- In `product-grid.component.html` use `srcset` + `sizes="(max-width:480px) 50vw, (max-width:768px) 33vw, 260px"`,
  with explicit `width`/`height` attributes (also helps CLS, §P12).
- Sweep other pages using `real-images` (main-page carousel, portfolio) for the same fix later.

### P12. Layout shift culprits
Card image containers are fixed-height (170 px), so images shouldn't shift. Likely culprits:
1. **Web font swap** — Roboto + Material Icons still come from Google Fonts (`index.html:62-65`).
   Icons render as raw ligature text first (that's also a visual glitch). This is old-plan **P6**:
   self-host woff2, `font-display: swap` + a `size-adjust`-matched fallback for Roboto,
   `font-display: block` for the icon font.
2. Hydration-time changes (result count, conditional controls) — reserve space (`min-height`) if the
   expanded audit names them.
Add `width`/`height` to card `<img>`s regardless (free insurance).
**Get the element list from the expanded "Layout shift culprits" row before spending effort here.**

### P13. Unused JS (409 KiB) — diagnose, don't guess
Run `ng build` with `"namedChunks": true` + `npx source-map-explorer dist/**/main*.js` (or the esbuild
metafile). Expected findings: Ignite UI common chunk, gtag (loads post-`load`, still counted — accept),
`@igniteui/material-icons-extended` (check it registers only the used icons — instagram/tiktok — not
the whole set). Weight-0 audit; only worth real effort if TBT ever degrades (currently fine).

### P14. Unused CSS (149 KiB)
Already slimmed from ~815 KiB. Optionally extend `$exclude-components` in `styles.scss:31` (verify
whether `igx-carousel` is still used after the custom card flip replaced it). Weight-0 — low priority.

### P15. Cache lifetimes (1,789 KiB) + document latency (150 ms) — infrastructure carry-overs
Both are old-plan items, not code bugs:
- 150 ms = the trailing-slash 301 (P5) — the report itself says the test URL redirected. Audit `/products/`.
- Cache TTL is GitHub Pages' hard `max-age=600` (P9) — needs Cloudflare (or a host with header control).

### P16. (Optional, weight-0) 58 non-composited animations
Hover transitions animate `box-shadow`/`filter`/`background-color` (cards, CTAs, sort pills). If
chasing the last points, restrict hover transitions to `transform`/`opacity` and pre-render shadows
via a `::after` opacity fade. Skip unless CLS/TBT numbers say otherwise.

## 6C. Implementation order (hand-off checklist)

| # | Task | Effort | Impact |
|---|---|---|---|
| 1 | A3 CTA contrast tokens (both themes) | S | A11y +7-weight audit, site-wide |
| 2 | A5 heading order (`h2` + tooltip out of `h3`) | S | A11y +3-weight audit |
| 3 | A4 touch targets (clear btn, +N chip, footer links, icon btns) | S/M | A11y, mobile UX |
| 4 | P10 eager first-row images + fetchpriority | S | LCP — biggest perf win |
| 5 | P11 thumbnail pipeline + srcset + width/height | M | −700 KiB+, LCP/SI, mobile |
| 6 | P12 self-host fonts (old P6) | M | CLS + FCP, site-wide |
| 7 | P15/P9 Cloudflare + audit-slash discipline | infra | repeat visits, +150 ms per run |
| 8 | P13/P14/P16 | opt | only if scores still short |

**Verification (must pass all four combos):**
```bash
npm run build
npx http-server dist/dprinting-services-website/browser -p 8080
# In incognito DevTools, force prefers-color-scheme via Rendering panel, then Lighthouse:
#   /products/ light + dark, desktop + mobile.
# Also re-run axe DevTools on both themes for the contrast items (gradients aren't
# reliably computed by Lighthouse — don't trust a silent pass on gradient buttons).
```
Re-check `/blog/` and the main page after — the CTA/token, font, and image fixes are shared surfaces.

**Info still worth collecting (nice-to-have, not blocking):** the expanded element lists for
"Layout shift culprits", the contrast audit, and the touch-target audit — save the full report
(HTML or JSON) into the repo (e.g. `lighthouse-reports/products-2026-07-12.json`) so the implementing
model can read exact selectors instead of relying on the inference above.

---

FROM FABLE:

The plan is written to LIGHTHOUSE-IMPROVEMENT-PLAN.md. Here's the TLDR of what I found:

The failing blog page is not broken. I traced the whole pipeline for infill-pri-3d-pechat-platnost-zdravina-i-filament: the route is registered, the markdown is bundled at build time into blog-content.generated.ts (a missing slug would fail the build, not the page), and I fetched the live URL just now — it serves the full prerendered article correctly. The Lighthouse error was environmental. My prime suspect is global-error-handler.service.ts: in production, any uncaught error (even a transient gtag/ripple hiccup) navigates the page to /error mid-audit, which makes Lighthouse abort. The plan recommends making the handler log instead of auto-navigating, and re-running the audit in incognito against the trailing-slash URL.

Why /blog/ scores Performance 73: only five metrics are scored (TBT/LCP/CLS/FCP/SI), and three are failing. The root causes I confirmed in code:

The LCP image is lazy-loaded — blog-list-page.component.html:45 puts loading="lazy" on every card cover including the first, above-the-fold one. This alone adds ~2s of LCP delay. Biggest single win.
No client hydration — app.config.ts lacks provideClientHydration(), so the prerendered HTML is thrown away and re-rendered client-side.
815 KB CSS, 89% unused — styles.scss:28 includes the entire Ignite UI theme; it should include only the components you use.
1.67 MB main.js — all 19 routes are eagerly imported in app.routes.ts; converting to loadComponent lazy routes will split it.
Trailing-slash 301 — the audit hit /blog which GitHub Pages redirects to /blog/ (+220 ms billed to the page). Canonicals/sitemap should standardize on the slash, and future audits should target slash URLs.
Also flagged: blog cover images missed the WebP migration (900 KB savings), Google Fonts lack font-display, and — notable — your .htaccess is dead weight: GitHub Pages ignores it and hard-caps caching at 10 minutes, so the caching fix requires Cloudflare in front or a different host.
Accessibility 94 → 100 needs exactly two things, both with precise file/color targets in the plan: contrast fixes (nav green #4CAF50, read-more #667EEA, date grey #7F8C8D, footer icons #8A8A8A — suggested replacements all verified ≥4.5:1) and heading order (card titles h3→h2, dates h5→span). Best Practices and SEO are already 100 on this page.