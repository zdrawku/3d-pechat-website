# CLAUDE.md — 3dpechat.bg

Instructions loaded automatically every session. **Read
[`AI_INSTRUCTIONS.md`](AI_INSTRUCTIONS.md) for the full project guide** (blog
pipeline, SEO, performance, directory map); this file carries the rules that must
never be missed.

## 🚨 Rule 1 — Always build UI with Ignite UI for Angular

**Every** piece of UI on this site is built from Ignite UI Angular components.
Never hand-roll a plain-HTML equivalent when an `igx-*` component exists.

| Need | Use | Not |
|------|-----|-----|
| Card / panel / tile | `igx-card` + `igx-card-header` / `-content` / `-footer` | `<div class="card">` |
| Button, or a link that looks like one | `igxButton="contained\|outlined\|flat"` | `<button class="btn">`, styled `<a>` |
| Icon button | `igxIconButton` | `<button>` with an icon inside |
| Icon | `igx-icon` (Material set) | inline SVG, emoji-as-icon |
| Avatar / initial circle | `igx-avatar` (`shape="circle"`, `initials`, `bgColor`) | `<span>` with border-radius |
| Carousel / slides | `igx-carousel` + `igx-slide` | hand-rolled scroller |
| Text field / search | `igx-input-group` + `igxInput` (+ `igxPrefix`/`igxSuffix`) | bare `<input>` |
| Transient message | `igx-snackbar` | custom toast div |
| Tooltip | `igxTooltip` + `igxTooltipTarget` | `title` attribute |

Plain HTML is correct **only** for semantics/layout with no component
counterpart: `<section>`, `<ul>/<li>` wrappers, `<p>`, `<h1>`–`<h6>`.

**Three traps, all of which have already bitten this project:**

1. **`$exclude-components` in [`src/styles.scss`](src/styles.scss).** A component
   in that list gets **no CSS emitted** and renders unstyled. Currently excluded
   (do not use without removing from the list first): `igx-chip`, `igx-divider`,
   `igx-dialog`, `igx-badge`, `igx-banner`, `igx-list`, `igx-tabs`, `igx-switch`,
   `igx-checkbox`, `igx-radio`, `igx-expansion-panel`, `igx-stepper`,
   `igx-slider`, `igx-toast`, `igx-tree`, `igx-grid*`, and others — check the
   list before reaching for one.
2. **Standalone imports.** Components are standalone; add the component/directive
   to the `imports:` array (`IGX_CARD_DIRECTIVES`, `IgxButtonDirective`,
   `IgxAvatarComponent`, `IgxIconComponent`, …) or the template silently renders
   the tag as an unknown element.
3. **`igx-card-content` restyles its direct children.** Ignite gives each one its
   body type and `margin: 0`, beating component classes — a title, font size or
   margin set on them silently does nothing. Titles go in `igx-card-header`
   (`igxCardHeaderTitle`); space the content with a `gap` on the content itself.
   Cards with an icon + title + text use the **info-card pattern**:
   [`src/app/_info-card.scss`](src/app/_info-card.scss) and
   [`AI_INSTRUCTIONS.md`](AI_INSTRUCTIONS.md) § Info cards.

Style via the theme's CSS custom properties and the site's tokens
(`--ig-*`, `--bg-*`, `--shadow-*`, `--radius-*`, `--space-*` in `styles.scss`)
plus the `fluid()`, `sla-hover` and `info-card` mixins — not by overriding
component internals. There are `mcp__igniteui-theming__*` MCP tools for theming work.

**Every new component gets a spec asserting the Ignite tags are present**, so a
later edit can't quietly regress to plain HTML — see
[`happy-customers.component.spec.ts`](src/app/shared/happy-customers/happy-customers.component.spec.ts)
("builds the section from Ignite UI components").

## 🚨 Rule 2 — Design-first for user-facing work

Before implementing any user-facing feature, produce a design artifact showing
2–4 variants (branded mockups, light + dark, recommended option marked) and get
approval. Implementation follows the approved variant. See the artifacts table in
[`FEATURE-IDEAS-PLAN.md`](FEATURE-IDEAS-PLAN.md).

## 🚨 Rule 3 — Cyrillic + PowerShell 5.1 don't mix

Never bulk-edit repo files through Windows PowerShell 5.1 — it re-encodes and
corrupts the Bulgarian text. Use the editor tools (UTF-8 safe) or Git Bash.

## 🚨 Rule 4 — Data lives in JSON, git is the source of truth

The site is fully static (Angular SSR prerender → GitHub Pages): **no backend,
no database.** Content is curated JSON imported at build time — products
([`src/data/products.json`](src/data/products.json)), reviews
([`src/data/reviews.json`](src/data/reviews.json)), gallery `manifest.json`
files. Build-time import (not runtime fetch) keeps the prerendered HTML complete
for SEO. See [`src/data/README.md`](src/data/README.md).

## 🚨 Rule 5 — Facts, blog SEO and URLs have one source each

This site is recommended by AI assistants (ChatGPT etc.) because its pages,
schema and listings agree with each other. Each item below has exactly one
source; never duplicate or hand-write it elsewhere. The full plan is
[`AI-VISIBILITY-PLAN.md`](AI-VISIBILITY-PLAN.md).

1. **Business facts → [`src/data/business.json`](src/data/business.json).**
   Services, technology, materials, prices, minimum order, lead times, files,
   size, delivery, payment, hours, address. Any copy (pages, blog posts, product
   descriptions, FAQ, llms.txt) may state only what its `facts` say and never
   what `neverClaim` lists. In short: **FDM only, PLA stocked (other materials
   bought per order), no SLA/SLS/scanning, no same-day promises, no invoices, no
   fixed modeling prices (the offer is free; modeling is priced by complexity).**
   Never invent a price, time or size. Generated from it:
   - the `LocalBusiness` JSON-LD and `og:site_name` in `index.html`/`404.html`
     (`scripts/generate-business-schema.js`, run in prebuild). **Never hand-edit
     the `organization-jsonld` block.**
   - llms.txt
   - the footer address, and the contact page's address and hours (via
     `src/data/business.ts` and `src/app/i18n/business-copy.ts`)
   - every number in every language's copy and the calculator's minimum order
     (structured fields such as `pricing` and `leadTimeWorkingDays`, passed into
     translations as `{placeholders}`)
   - the auto-blog prompt

   The FAQ lives in [`src/data/faq.json`](src/data/faq.json). It's shown on
   `/prices/` as FAQPage schema, and `faq.spec.ts` blocks numbers that aren't in
   the facts. When a fact changes, change it in `business.json`, rebuild, then
   fix `faq.json` and any hand-written copy that still says otherwise.
2. **Blog post metadata/SEO → [`blog-posts.registry.ts`](src/app/services/blog-posts.registry.ts).**
   A post is its markdown plus its registry entry — **no component, no route**:
   one component ([`src/app/blog/article/`](src/app/blog/article/)) serves every
   post in every language and makes the one SEO call,
   `seoService.applyBlogPostSeo('<slug>')`. It emits the meta tags, canonical,
   hreflang and a `BlogPosting` + `BreadcrumbList` `@graph` at prerender time.
   **Never hand-write `updateSeo`/`setStructuredData` for a post.** Extra schema
   comes from the post itself: a `<!-- faq -->` section becomes FAQPage, and
   `ARTICLE_EXTRAS` adds a VideoObject for the video post. A registered post
   without text fails the prerender on purpose; an unknown slug is a 404.
   Article texts load per language through the post route's resolver, so never
   import `blog-content.generated.ts` into code that runs on every page.
3. **"Last updated" dates are hand-maintained, never the build date.** When a
   post's content changes substantively, bump its `dateModified` in the
   registry. When a main page changes, bump its entry in `MAIN_PAGE_LASTMOD` in
   [`scripts/generate-sitemap.js`](scripts/generate-sitemap.js). These feed the
   sitemap, the schema and IndexNow, so a fake date is a bug. After every deploy
   the workflow pings Bing via IndexNow (`scripts/indexnow.js`) for URLs whose
   `<lastmod>` changed. Keep exactly one `public/<32-hex>.txt` key file.
4. **URLs end with `/`.** `TrailingSlashUrlSerializer` adds the slash to
   `routerLink`s (keep `routerLink` values slash-free). Markdown links must be
   written as `/blog/<slug>/`. `postbuild` (`scripts/check-internal-links.js`)
   fails the build on any slash-less internal link.
5. **Never break an indexed URL.** To rename, merge or remove a post or route,
   keep the old path as a `LegacyRedirectComponent` route in `app.routes.ts`
   (`data: { to: '/new/path/' }`) and record it in
   [`LEGACY_REDIRECTS.md`](LEGACY_REDIRECTS.md). GitHub Pages can't do server
   redirects, and these routes stay forever.

How to add a blog post step by step: [`AI_INSTRUCTIONS.md`](AI_INSTRUCTIONS.md)
§ Content Management. `ARTICLE_CREATION_GUIDE.md` and `SEO_GUIDE.md` are older
and lose to this rule wherever they disagree.

## 🚨 Rule 6 — Every UI string is translated

The main pages and the blog index exist in Bulgarian (`/…`) and English
(`/en/…`); a blog post exists in English only once it is translated
(`translatedPosts` in `src/i18n/locales.json`). Guide:
[`src/i18n/README.md`](src/i18n/README.md) (§ Translating a blog post); plan and
next steps: [`LOCALIZATION-PLAN.md`](LOCALIZATION-PLAN.md).

- **No hard-coded user-facing text** in the shell or a localized page (home,
  portfolio, products, prices, contact, shared components they use). Strings
  live in `src/i18n/<lang>/*.json` and render through the typed `t` pipe;
  internal links use `| localizePath`. Business numbers enter translations as
  `{placeholders}` from `business.json`, never typed in.
- **Changing Bulgarian copy means changing every language's copy** of that key
  (a missing key fails the build; a stale one doesn't). A new product gets its
  English copy in `src/i18n/en/content/products.json` (until then `/en/products/`
  shows the Bulgarian copy, marked `lang="bg"`, and the spec reports it as
  pending); the FAQ changes in `src/data/faq.json` and
  `src/i18n/en/content/faq.json` together; a new gallery image's alt text goes
  in `src/i18n/en/content/gallery.json` under its `src` (same fallback).
- **Languages, localized pages and translated posts have one source:**
  `src/i18n/locales.json`. Routes, hreflang, the switcher, sitemap alternates,
  llms.txt and the live check read it. A new localized page or language also
  needs `MAIN_PAGE_LASTMOD` entries for each of its URLs.
- **Editing a translated post's Bulgarian text means updating its translation**
  (`src/assets/blogs/<lang>/<slug>.md`, and `dateModified` in
  `src/i18n/<lang>/content/blog.json`); nothing catches a stale translation.
  New auto-blog posts arrive with an English draft in the same PR; an existing
  post gets one with `npm run translate-post -- <slug>`. Amounts are in euro
  only — never leva (a spec fails on them).

## Verify before claiming done

`npm run build` **and** `npm test -- --watch=false --browsers=ChromeHeadless`
must both pass, plus `npm run test:scripts` when you touch `scripts/`. For user-facing changes also look at the result — `npx ng serve`
plus a Playwright screenshot (Playwright is already a dependency) in light and
dark at desktop and mobile widths. Report failures with their output. After a
deploy, `npm run check:live` verifies production read-only (crawler access,
schema vs `business.json`, every sitemap URL, redirects, llms.txt, FAQ, and
`lang` + `hreflang` on every page in every language).

**Close every change set with the [`handoff`](.claude/skills/handoff/SKILL.md)
skill:** `node scripts/handoff-checklist.js` maps the changed files to their
checks, and the final message carries a **Test plan** (what ran, with results;
what to check by hand, with exact URLs in both languages) and a **What's next
(once it's live)** list (check:live, Search Console, IndexNow, visual
baselines, Analytics… — ordered, with who does each and when).

## Other standing rules

- Keep `404.html` in sync with `index.html` (meta tags, CSP, scripts). The
  LocalBusiness JSON-LD and `og:site_name` in both are generated; don't edit them.
- Run `npm run generate-sitemap` after adding routes or blog posts (`npm run build` does it too; a new main
  route also needs a `MAIN_PAGE_LASTMOD` entry, or the generator exits).
- Image paths in markdown/HTML use `assets/…` (no leading slash), kebab-case,
  WebP preferred.
- No `schema.org` `Review`/`AggregateRating` markup for Google-sourced reviews —
  it's self-serving markup and risks a manual penalty.

## Skills

- **`/add-product`** ([`.claude/skills/add-product/SKILL.md`](.claude/skills/add-product/SKILL.md))
  — add a catalog product from photos + a one-line brief; converts to webp,
  drafts the Bulgarian copy for approval, appends to `products.json`, opens a PR.
- **`/make-short`** ([`.claude/skills/make-short/SKILL.md`](.claude/skills/make-short/SKILL.md))
  — make a vertical short (TikTok/Shorts/Reels) from a request in words:
  uploaded clips/photos + catalog photos, and/or a phone-screen Playwright
  recording of a site flow; Bulgarian captions + voice checked against
  `business.json`. The same skill is the agent behind the „🎬 Ново кратко
  видео“ issue (`make-short.yml`, Claude Code on the owner's subscription via
  `CLAUDE_CODE_OAUTH_TOKEN` — never `ANTHROPIC_API_KEY` in that job). Both
  issue forms are limited to the people in `.github/issue-authors.json`.
- **`/handoff`** ([`.claude/skills/handoff/SKILL.md`](.claude/skills/handoff/SKILL.md))
  — the end of every change: a test plan for exactly the changed files and the
  steps to run once it's live (`scripts/handoff-checklist.js`).
