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

**Two traps, both of which have already bitten this project:**

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

Style via the theme's CSS custom properties and the site's tokens
(`--ig-*`, `--bg-*`, `--shadow-*`, `--radius-*`, `--space-*` in `styles.scss`)
plus the `fluid()` and `sla-hover` mixins — not by overriding component
internals. There are `mcp__igniteui-theming__*` MCP tools for theming work.

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

## Verify before claiming done

`npm run build` **and** `npm test -- --watch=false --browsers=ChromeHeadless`
must both pass. For user-facing changes also look at the result — `npx ng serve`
plus a Playwright screenshot (Playwright is already a dependency) in light and
dark at desktop and mobile widths. Report failures with their output.

## Other standing rules

- Keep `404.html` in sync with `index.html` (meta tags, CSP, scripts).
- Run `npm run generate-sitemap` after adding routes or blog posts.
- Image paths in markdown/HTML use `assets/…` (no leading slash), kebab-case,
  WebP preferred.
- No `schema.org` `Review`/`AggregateRating` markup for Google-sourced reviews —
  it's self-serving markup and risks a manual penalty.

## Skills

- **`/add-product`** ([`.claude/skills/add-product/SKILL.md`](.claude/skills/add-product/SKILL.md))
  — add a catalog product from photos + a one-line brief; converts to webp,
  drafts the Bulgarian copy for approval, appends to `products.json`, opens a PR.
