# Feature Ideas Plan — Gift Box, Gallery Ordering, Product Workflow

> Drafted 2026-07-12 by Claude (Fable). Status: **proposal — no code changes made.**
> The user was away; all open questions were decided autonomously. Every decision is
> marked with a `🔵 DECISION` tag and collected again in the final section so they can
> be revised later.

## Context (how the site works today — constraints the plan must respect)

- **Fully static hosting.** Angular 21 + SSR prerender, deployed to GitHub Pages via
  `.github/workflows/github-pages.yml`. There is **no backend server and no database**,
  and GitHub Pages cannot run one.
- **Contact form** posts to Web3Forms (free tier: single attachment, ≤ 1 MB, currently
  disabled because uploads need the Pro plan). Ordering a product = navigating to
  `/contact` with a prefilled message (`orderProduct()` in
  `src/app/products-page/products-page.component.ts`).
- **Products** are *not* stored as JSON today — they are a hardcoded
  `productVariants: ProductVariant[]` array inside `products-page.component.ts`
  (lines ~41–214). Adding a product means editing TypeScript.
- **Carousels/galleries** (main page + portfolio) are generated at build time by
  `scripts/generate-carousel-images.js`: it scans an assets folder, **sorts filenames
  alphabetically**, and writes a `carousel-images.ts` file. Ordering is only
  controllable by renaming files — the exact pain point of Idea 2.
- **Automation precedent already exists:** the auto-blog pipeline
  (`scripts/auto-blog/` + `auto-blog.yml` GitHub Action) generates content with the
  Anthropic SDK, commits it, and opens a PR. Idea 3 reuses this proven pattern.

**Guiding principle for all three ideas:** stay static, stay free, keep git as the
single source of truth. No server/database is introduced anywhere in this plan —
everything ships as data files + build scripts + (optionally) GitHub-powered flows.

---

## Idea 1 — 🎁 "Кутия Изненада" (Surprise Gift Box) product

### Polished concept

A curated 3D-printed mystery gift box: the buyer surprises a loved one **without
needing an occasion**. The buyer doesn't pick the exact items — they pick the
*ingredients*: categories of prints, the recipient profile, and a size/budget tier.
You (the maker) assemble the box. **Both the giver and the receiver end up
surprised — that's the whole charm, and it should be the marketing hook.**

This is a genuinely strong product idea for a 3D-print business because:

- It converts *browsing* visitors into buyers who don't know what specific item they want.
- It monetizes your existing print catalog (frames, stands, coin cards…) as box fillers.
- Mystery/surprise boxes have proven demand and are highly giftable and shareable
  (unboxing photos → social proof → portfolio content, with buyer consent).
- It's print-on-demand friendly: you control the contents, so you can print what's
  efficient for you at that moment (filament colors on hand, machine time, etc.).

### The 10 categories

🔵 DECISION: The idea said "pick from 10 different categories" — the concrete list
wasn't specified, so I drafted one grounded in what the site already sells/prints:

1. **За четящия** (For the reader) — book dividers/разделители, bookmarks, книгодържач
2. **Спомени и снимки** (Memories & photos) — photo frames, stands, литофан (lithophane from a photo — already a blog topic!)
3. **Романтика** (Romance) — "къде се срещнахме" coordinate pieces, hearts, couple items
4. **За бюрото / офиса** (Desk & office) — headphone stands, cable organizers, pen holders
5. **Геймър** (Gamer) — controller stands, Warhammer-style mini figures/terrain (existing blog topic)
6. **Дом и уют** (Home & cozy) — vases, coasters, wall décor, plant pots
7. **Колекционер** (Collector) — coin cards (existing flagship product), display stands
8. **За детето** (For the kid) — safe toys, fidgets, educational prints
9. **Практични джаджи** (Practical gadgets) — keychains, hooks, openers, phone stands
10. **Изненадай ме напълно** (Total surprise) — maker's choice, the "pure gamble" category

### Box configuration (buyer flow)

1. **Pick a size tier** — 🔵 DECISION: three tiers, named to reinforce the surprise theme:
   - **S — "Мини изненада"**: 2–3 small prints
   - **M — "Класик"**: 3–4 prints incl. one medium centerpiece
   - **L — "Уау кутия"**: 5+ prints incl. one large/personalized centerpiece
   - *(No prices in this plan — you set them; placeholders go in the product JSON.)*
2. **Pick up to 3 categories** from the 10 (fewer picks = more surprise).
3. **Recipient hints (optional):** for him/her/kid, favorite color, one free-text hint
   ("тя обича котки").
4. **Optional personalization add-on:** a name/photo/coordinates on one item
   (upsell; uses your existing personalization capability).

### Implementation (static-site friendly, phased)

- **Phase 1 — ship it with zero new infrastructure:**
  - Add the gift box as a product entry (it becomes the first product added via the
    new Idea-3 workflow — nice dogfooding).
  - Build a small **configurator section** on a dedicated page `/gift-box`:
    plain Angular reactive form (tier radio, category chips with a max-3 limit,
    hints inputs). No backend needed — on submit it routes to `/contact` with a
    **structured prefilled message** (same mechanism as `orderProduct()` today):
    ```
    🎁 Поръчка: Кутия Изненада — размер M
    Категории: Романтика, Спомени и снимки
    За: нея | Цвят: лилаво | Хинт: обича котки
    Персонализация: да — снимка
    ```
  - SEO: own route, own meta via the existing `SeoService`, plus `Product`
    structured data; the surprise-box angle is also a great blog-post topic for the
    auto-blog pipeline ("Идеалният подарък без повод").
- **Phase 2 (later, optional):** photos of example boxes (unboxing gallery),
  a "past boxes" carousel — which will use the Idea-2 manifest system.

🔵 DECISION: No online payment in scope. The site has no checkout anywhere; the gift
box follows the existing "order via contact form → you reply with price/payment"
flow. Revisit only if the whole site ever gets e-commerce.

---

## Idea 2 — 🖼️ Controllable image ordering for Portfolio & Carousels

### Problem restatement

`generate-carousel-images.js` scans folders and sorts alphabetically, so curating
order requires renaming files (`0.webp`, `1 (2).webp`, `20250109_204235.webp`…).
Wanted: drag/specify images and their order without renaming.

### Chosen design: JSON manifest as source of truth + sync script + local drag-drop editor

🔵 DECISION: Manifest-file approach over the alternatives (see "options considered").

**Step 1 — Manifest per gallery.** Add `manifest.json` *inside each image folder*
(`src/assets/real-images/first-page-images/manifest.json`, same for
`general-images/`):

```json
{
  "images": [
    { "file": "20260104_134937.webp", "alt": "3D принтирана ваза", "hidden": false },
    { "file": "0.webp", "alt": "", "hidden": false }
  ]
}
```

Array order **is** display order. `hidden: true` keeps a file in the folder but out
of the site (today the only way to hide an image is deleting it). `alt` fixes a
Lighthouse/accessibility gap for free while we're here.

**Step 2 — Upgrade the generator into a *sync* script.** `generate-carousel-images.js`
becomes: read folder + manifest → **new files on disk are appended to the manifest
end** (never lost, never reordered) → entries whose files were deleted are dropped →
write both the updated manifest and the same `carousel-images.ts` output as today.
Zero changes needed in the Angular components; `prestart`/`prebuild` hooks keep working.
Workflow for "just add photos" stays exactly as cheap as now — drop files in the
folder, they appear (at the end).

**Step 3 — Local drag-and-drop editor.** A single standalone `scripts/gallery-editor/`
tool: `npm run gallery-editor` starts a tiny Node/Express server (dev-only,
localhost) that serves one static HTML page showing each gallery as a thumbnail
grid with native HTML5 drag-and-drop, hide toggles, and alt-text inputs; "Save"
POSTs the new order and the server rewrites `manifest.json` + regenerates the `.ts`
files. You then review the diff and commit. No auth needed — it never ships to the
site; it's a maker tool like the other `scripts/`.

🔵 DECISION: The editor is a **local dev tool, not a page in the deployed site**.
A live "/admin" page can't write files on GitHub Pages, and shipping editor code
to production adds weight and attack surface for zero user value.

**Options considered and rejected:**
- *Keep filename-prefix ordering (`01-…`, `02-…`)* — no code, but it's exactly the
  renaming chore being complained about; rejected.
- *Order stored in a separate config outside the folders* — drifts from the actual
  files more easily than a co-located manifest; rejected.
- *In-site admin panel writing via GitHub API* — heavy (OAuth, tokens in browser),
  overkill for a one-person workflow; rejected for now, though Idea 3 Phase 3 could
  later absorb gallery editing too.

**Effort estimate:** Step 1+2 ≈ small (one script rewrite, backwards compatible).
Step 3 ≈ a focused day. Products' front/back images are **not** part of this system
(they're per-product fields, handled by Idea 3).

---

## Idea 3 — 📦 Seamless "add a product" workflow

### Problem restatement

Adding a product today = hand-editing a TypeScript array + manually converting/
placing images. Wanted: upload images + title + description, done. An admin panel
implies a server/DB — but the site is static, and staying static is cheaper and
safer.

### Chosen design: extract data to JSON, then automate the edit — in three phases

**Phase 1 — Make products *data*, not code (prerequisite for everything).**

- Move the `productVariants` array to `src/data/products.json`; move the
  `ProductVariant` interface to `src/app/models/product.model.ts`.
- 🔵 DECISION: Import the JSON **at build time** (`import products from
  '…/products.json'` with `resolveJsonModule`) rather than fetching it over HTTP at
  runtime. Rationale: keeps SSR prerender output complete (SEO — product names in
  the prerendered HTML, which matters given the recent GSC indexing work), no
  loading state, no runtime failure mode. The trade-off (rebuild required to change
  data) is void because a rebuild/deploy is required to publish new images anyway.
- While extracting, drop the UI-state field `showFront` from the data model (it's
  runtime state, not product data) and auto-assign `id`s.

**Phase 2 — `/add-product` Claude Code skill (the daily driver). 🔵 DECISION: this
is the primary UX, chosen over building an admin panel.**

A project skill (`.claude/skills/add-product/SKILL.md`) so that in any session you
can say: */add-product — here are 2 photos in `~/Downloads`, title "Стойка за
телефон", it's a desk accessory* — and the skill:

1. Converts/resizes images to `.webp` via the existing `sharp` dependency
   (reusing `scripts/convert-images-to-webp.js` conventions) and places them in
   `src/assets/real-images/`.
2. Appends a well-formed entry to `products.json`: generates `linkId` (transliterated
   slug), `dateAdded` (today), and **drafts** the Bulgarian description and SEO
   `tags` from the photos + your one-line brief — you approve the wording before it's saved.
3. Runs the build to validate, shows you the diff, commits on a branch, opens a PR
   (same lifecycle as the auto-blog pipeline). Merging deploys automatically.

Time from "I have photos" to "PR open": ~2 minutes of your attention. Works from
the PC where the photos are, no hosting, no auth, no cost.

**Phase 3 (optional, later) — add-from-anywhere via a GitHub Issue form.**

For adding a product from a phone (photo taken at the printer): a GitHub **Issue
template** (`new-product.yml` form: title, description, category, drag-in photos —
GitHub hosts issue images for free) plus a GitHub Action that triggers on the
labeled issue, downloads the attached images, converts to webp, updates
`products.json`, and opens the same auto-PR. This is ~90% a copy of the existing
`auto-blog.yml` machinery. Auth is solved for free: only repo collaborators can
trigger it. Build it only if phone-based adding turns out to be a real need.

**Options considered and rejected:**
- *In-site admin panel + real backend (Firebase/Supabase)* — introduces a database,
  auth, hosting costs, and a second source of truth next to git; massively more
  build & maintenance for a single-admin site; rejected.
- *Git-based CMS (Decap/Sveltia at `/admin`)* — closest to the "admin panel" wish
  and still static, but needs an OAuth gateway (extra moving part), config
  maintenance, and mostly duplicates what Phases 2+3 do cheaper; rejected for now —
  reconsider only if a non-technical person ever needs to add products.

---

## How the three ideas reinforce each other

- **Idea 3 Phase 1 (products.json) ships first** — it's the foundation: Idea 1's
  gift box is then added *via* the new workflow as its first real test.
- **Idea 2's manifest pattern** is the same philosophy as products.json: curated
  JSON data + generator script + git as source of truth. Same mental model, same
  review-diff-commit-deploy loop everywhere.
- The gift box page later gets an "example boxes" gallery managed by the Idea 2
  manifest system.

**Suggested build order:**

| # | Work item | Idea | Size |
|---|-----------|------|------|
| 1 | Extract `products.json` + model file | 3.1 | S |
| 2 | Manifest + sync rewrite of `generate-carousel-images.js` | 2.1–2.2 | S |
| 3 | `/add-product` skill | 3.2 | M |
| 4 | Gift box product + `/gift-box` configurator page | 1 | M |
| 5 | Local drag-drop gallery editor | 2.3 | M |
| 6 | (Optional) Issue-form add-from-phone flow | 3.3 | M |
| 7 | (Optional) Gift box unboxing gallery, blog post | 1 | S |

---

## 📋 Decisions made autonomously — review & revise list

Each is safe to reverse; none are implemented yet.

1. **Stay 100% static — no server, no database, for all three ideas.** Git remains
   the single source of truth; automation happens via scripts, a skill, and GitHub
   Actions. *(Revise if: you want live inventory, payments, or non-technical editors.)*
2. **Gift box name:** working title **„Кутия Изненада“**, tiers „Мини изненада /
   Класик / Уау кутия“. *(Pure branding — rename freely.)*
3. **The 10 gift box categories** as listed above, drafted from your existing
   catalog and blog topics. *(Swap any of them.)*
4. **Gift box ordering flow = existing contact-form prefill**, structured message,
   no payment/checkout. *(Revise if you want deposits/payment links.)*
5. **Max 3 categories per box** — keeps surprise high and your assembly simple.
6. **Gallery ordering via co-located `manifest.json` per image folder**, with
   `alt` and `hidden` fields; sync script appends new files at the end instead of
   alphabetizing everything. *(Alternative: separate central config — rejected.)*
7. **Gallery editor is a local `npm run gallery-editor` tool**, not a deployed
   admin page. *(Revise if you need to reorder from a phone/other machine.)*
8. **Products move to `src/data/products.json`, imported at build time** (not
   runtime HTTP) to keep prerendered SEO content intact; `showFront` dropped from
   the data model. *(Revise if products must ever change without a deploy.)*
9. **Primary add-product UX is a Claude Code skill (`/add-product`)** that converts
   images, drafts BG copy for approval, and opens a PR — mirroring the auto-blog
   pipeline. Admin panel and git-CMS options rejected for now.
10. **Phone-based product adding (GitHub Issue form + Action) deferred** to an
    optional later phase.
11. **Build order** as in the table above — foundations (json extraction, manifest)
    before features (gift box, editor).
