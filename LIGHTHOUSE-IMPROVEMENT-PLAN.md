# Lighthouse Improvement Plan — target 100/100/100/100

Baseline: Lighthouse 13.3.0, **desktop** preset, run against the production site (GitHub Pages).
Reports are analyzed per page; most fixes below are **site-wide** and will lift every page at once.

## Page report tracker

| Page | Perf | A11y | Best Practices | SEO | Status |
|---|---|---|---|---|---|
| `/blog/` | 73 | 94 | 100 | 100 | Analyzed (2026-07-10) |
| `/blog/infill-pri-3d-pechat-platnost-zdravina-i-filament` | — | — | — | — | Lighthouse run errored — see §4 |
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