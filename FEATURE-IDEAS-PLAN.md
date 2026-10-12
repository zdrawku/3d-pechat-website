# Feature Ideas Plan — Gift Box, Gallery Ordering, Product Workflow, Google Reviews

> Drafted 2026-07-12, extended 2026-07-13 (Ideas 4–5) by Claude (Fable).
> Status: **✅ variants approved by Zdravko on 2026-07-13.** Approved choices are
> marked `✅ APPROVED`; the original autonomous decisions remain tagged
> `🔵 DECISION` and listed in the final section.
>
> **Implementation progress:** Ideas **2** (gallery manifest + editor), **3**
> (products.json + `/add-product` skill + issue-form flow), **4** (review CTA,
> all three layers) and **5** (Happy Customers section) are shipped. Remaining:
> **Idea 1** (gift box page). **Idea 6** (MakerWorld cross-linking triangle) was
> added 2026-10-11 and is ⬜ proposed, with no design artifact yet. See the
> build-order table at the bottom.

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

**Guiding principle for all five ideas:** stay static, stay free, keep git as the
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

Note by me:
About it, i strongly believe it should be a separate page OR providing a way to have pinned products at the top of the page, OR navigatable whether through the products page or a child nav item below the Продукти Nav drawer item, lets explore that, consider SEO, findability and further maintanance, The same way we add this gift box idea right now, will be used to add other MAIN products as well. Consider everyting and let me know what do you think via designs.

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

✅ APPROVED (2026-07-13): configurator layout = **Option B — single page + live
summary rail** from the [design artifact](https://claude.ai/code/artifact/e96da4a9-0f8e-4fa1-83f6-ce952afce78b).

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

## DONE Idea 2 — 🖼️ Controllable image ordering for Portfolio & Carousels

### Problem restatement

`generate-carousel-images.js` scans folders and sorts alphabetically, so curating
order requires renaming files (`0.webp`, `1 (2).webp`, `20250109_204235.webp`…).
Wanted: drag/specify images and their order without renaming.

### Chosen design: JSON manifest as source of truth + sync script + local drag-drop editor

🔵 DECISION: Manifest-file approach over the alternatives (see "options considered").

✅ APPROVED (2026-07-13): manifest format + editor **Option A — thumbnail grid with
drag-and-drop** (with Option B's ↑↓ arrows as keyboard fallback) from the
[design artifact](https://claude.ai/code/artifact/a5a929ca-1249-426f-9527-28ede18696fa).

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

## DONE Idea 3 — 📦 Seamless "add a product" workflow

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

✅ APPROVED (2026-07-13), with one added requirement: **images can also be pasted
directly into the skill call**, not only referenced by folder path.

✅ **IMPLEMENTED 2026-07-31** — [`.claude/skills/add-product/SKILL.md`](.claude/skills/add-product/SKILL.md),
backed by the shared [`scripts/add-product/lib.js`](scripts/add-product/lib.js)
(Bulgarian→Latin transliteration for `linkId`, next-free-`id` assignment, sharp
webp conversion matching `convert-images-to-webp.js`, and an append that does
**not** reformat the rest of `products.json` — the diff shows only the new
entry). Accepts both pasted images and folder paths, per the added requirement.

A project skill (`.claude/skills/add-product/SKILL.md`) so that in any session you
can say: */add-product — here are 2 photos in `~/Downloads`, title "Стойка за
телефон", it's a desk accessory* — **or paste the photos straight into the chat**
(Claude Code accepts pasted/attached images; the skill saves them to a temp
location and treats them exactly like file-path input) — and the skill:

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

**Phase 3 — add-from-phone via a GitHub Issue form. ✅ APPROVED (2026-07-13) as
MANDATORY — no longer optional — with an owner-only guard.**

✅ **IMPLEMENTED 2026-07-31** — issue form
[`.github/ISSUE_TEMPLATE/new-product.yml`](.github/ISSUE_TEMPLATE/new-product.yml),
workflow [`.github/workflows/add-product.yml`](.github/workflows/add-product.yml),
parser [`scripts/add-product/from-issue.js`](scripts/add-product/from-issue.js).
The guard is stricter than specified: a dedicated `check-owner` job requires the
author login to be `zdrawku` **and** `author_association == 'OWNER'` (both, not
either), every other job `needs:` that verdict, and a `reject-non-owner` job
comments + closes anything else before any code runs.

For adding a product from a phone (photo taken at the printer): a GitHub **Issue
template** (`new-product.yml` form: title, description, category, drag-in photos —
GitHub hosts issue images for free) plus a GitHub Action that triggers on the
labeled issue, downloads the attached images, converts to webp, updates
`products.json`, and opens the same auto-PR. This is ~90% a copy of the existing
`auto-blog.yml` machinery.

**Owner-only validation (required):** anyone can open an issue on a public repo,
so the workflow must verify the submitter before doing anything. Two independent
checks, both enforced in the Action:

1. **Job-level guard** — the job runs only when the issue author is you:
   `if: github.event.issue.user.login == 'zdrawku'` (belt-and-braces alternative:
   also accept only `github.event.issue.author_association == 'OWNER'`).
2. **Fail-closed behavior** — issues with the `new-product` label from anyone else
   are ignored by the pipeline (optionally auto-commented "products can only be
   added by the site owner" and closed).

Even if both checks were somehow bypassed, the flow still ends in a **PR you must
merge** — nothing reaches the live site without your review. That layered defense
(author check → PR gate → deploy on merge only) is the whole security model, and
it costs nothing to run.

**Options considered and rejected:**
- *In-site admin panel + real backend (Firebase/Supabase)* — introduces a database,
  auth, hosting costs, and a second source of truth next to git; massively more
  build & maintenance for a single-admin site; rejected.
- *Git-based CMS (Decap/Sveltia at `/admin`)* — closest to the "admin panel" wish
  and still static, but needs an OAuth gateway (extra moving part), config
  maintenance, and mostly duplicates what Phases 2+3 do cheaper; rejected for now —
  reconsider only if a non-technical person ever needs to add products.

---

## DONE Idea 4 — ⭐ Site-wide "Leave us a Google review" call to action

### Problem restatement

Wanted: a CTA on every page (banner, snackbar, dialog, or similar) inviting
visitors to leave a Google review, informed by how other businesses do it.

### ⚠️ First: the link itself must be fixed

The proposed URL (`https://www.google.com/search?q=3dpechat`) opens a **search
results page** — the visitor still has to find the business card and hunt for the
review button, and on some devices/locales it won't surface the review dialog at
all. The correct, industry-standard link opens Google's review form directly:

```
https://search.google.com/local/writereview?placeid=<PLACE_ID>
```

🔵 DECISION: Use the direct write-review link.

✅ RESOLVED (2026-07-13): Zdravko provided the Place ID from Google's Place ID
finder (3dpechat, бул. „Симеоновско шосе" 110 б, 1700 София):

```
Place ID:    ChIJZ512pmOFqkARSxCaV9bE1og
Review link: https://search.google.com/local/writereview?placeid=ChIJZ512pmOFqkARSxCaV9bE1og
```

Store it once as a constant (e.g. `src/data/site-links.ts`) so every CTA on the
site shares it. Before shipping, open the link once while logged in to confirm it
lands on the review dialog for the right business.

### What other businesses do (research summary)

Common patterns, roughly from least to most aggressive:

1. **Footer link/badge on every page** — standard practice; zero annoyance, always
   discoverable.
2. **Inline CTA blocks on high-traffic pages** — a styled banner in the page flow
   ("Доволни ли сте? Оставете ни ревю ⭐"), placed where engagement is highest.
3. **Post-interaction prompt** — shown right after a customer completes an action
   (form submitted, order placed). Universally cited as the highest-converting
   moment: the person has just engaged with you.
4. **Snackbar/toast after some engagement** — small, dismissible, remembers
   dismissal; fine if shown once, not on every page load.
5. **Modal/exit-intent popups** — used, but best-practice sources consistently warn
   they must be rare, easily dismissible, and never on page entry. Google also
   applies **SEO penalties for intrusive interstitials on mobile** — a real risk
   for this site given the recent GSC/indexing and Lighthouse work.

Also a **policy** note surfaced by the research: don't ask for a *positive* review
(review gating violates Google's rules) — ask for honest feedback.

### Chosen design: layered, no modals

🔵 DECISION: three non-intrusive layers instead of one aggressive dialog:

✅ APPROVED (2026-07-13): **all three layers ship together** as shown in the
[design artifact](https://claude.ai/code/artifact/1e006177-f26d-48e2-a41c-493e64bd1270)
(modal/exit-intent stays rejected).

✅ **IMPLEMENTED 2026-07-31** — all three layers, with the artifact's exact
Bulgarian copy. The link lives once in
[`src/data/site-links.ts`](src/data/site-links.ts) (`GOOGLE_REVIEW_URL`).

1. **Footer CTA (every page).** Small block in the shared footer:
   „Хареса ли ви работата ни? / Споделете мнението си в Google" + „⭐ Остави ревю"
   → direct review link. Satisfies "CTA on each page" with zero UX cost.
   *Shipped in `app.component.html` (footer bottom bar) + `.review_cta_footer` styles.*
2. **Contact-form success state (the money spot).** After a successful Web3Forms
   submit, the confirmation message gains a prominent review card
   („Работили сме заедно преди? / Разкажете как мина — мнението ви помага на други") —
   the visitor just finished interacting with you. Same for the future gift-box
   flow (Idea 1), whose confirmation passes through `/contact`.
   *Shipped in `contact-me-page.component.html`, rendered only when `submitStatus === 'success'`.*
3. **One-time snackbar for engaged visitors.** Reusable `ReviewCtaComponent` using
   the already-installed Ignite UI `IgxSnackbar`: appears after genuine engagement
   (second route navigation in a session, +2.5 s so it never fights the page
   render), single „ОСТАВИ РЕВЮ" action + dismiss; dismissal or click stored in
   `localStorage` with a 30-day cool-down so nobody sees it twice in a month.
   *Shipped as [`src/app/shared/review-cta/`](src/app/shared/review-cta/) with 7 unit
   specs. SSR: the whole template sits behind `@if (isBrowser)`, so the snackbar is
   absent from the prerendered HTML entirely — verified against the build output —
   rather than merely hidden with `aria-hidden`.*

🔵 DECISION: **No modal dialogs and no exit-intent popups** — annoyance + mobile
interstitial SEO risk outweigh the extra conversions for a portfolio-style site.

All copy in Bulgarian, phrased as "share your experience" (not "give us 5 stars"),
with a `rel="noopener"` external link + Google icon so expectations are clear.

**Effort estimate:** S–M (one shared constant, footer tweak, contact success tweak,
one snackbar component).

---

## DONE Idea 5 — 💬 "Доволни клиенти" (Happy customers) curated reviews section

### Problem restatement

Wanted: a widget/section showing hand-picked top Google reviews on the site.

### Options considered

- **Third-party review widgets (EmbedSocial, Jotform, Elfsight…)** — auto-syncing
  and zero-code, but they inject an external script (Lighthouse/performance hit,
  third-party branding, GDPR/cookie surface, free tiers rot into paywalls).
  Rejected — conflicts with the static/fast/free philosophy of this site.
- **Google Places API fetch** — official, but returns **only 5 reviews, not your
  choice of which**, needs an API key with billing attached, and an exposed
  browser key on a static site. Rejected.
- **Curated JSON in the repo** — you hand-pick the reviews (exactly what was asked:
  "I can specify the top google reviews"), zero runtime dependencies, prerendered
  into the HTML. The known drawback (reviews go stale without manual updates) is
  actually the *feature* here: it's a curated hall of fame, not a live feed.

🔵 DECISION: curated `src/data/reviews.json`, same pattern as `products.json`
(Idea 3) and the gallery manifests (Idea 2) — curated JSON + git as source of truth.

### Design

**Data** — `src/data/reviews.json`, imported at build time:

```json
{
  "reviews": [
    {
      "author": "Иван П.",
      "rating": 5,
      "date": "2026-05",
      "text": "Страхотно качество и бърза изработка…",
      "sourceUrl": "https://maps.google.com/…",
      "featured": true
    }
  ]
}
```

Array order = display order (consistent with Idea 2's manifests). No avatar photos —
a generated colored initial circle keeps it personal-data-light and asset-free.

**Component** — standalone `HappyCustomersComponent` („Доволни клиенти"): section
header with overall star rating + review count, cards with stars/text/author/date,
and two links closing the loop with Idea 4: „Виж всички ревюта в Google" and
„Остави и ти ревю" (the same direct review link). Mobile: swipeable strip;
desktop: 2–3 column grid of `featured` reviews.

**Placement** — 🔵 DECISION: main page (below the hero/carousel area — social proof
where first-time visitors decide) **and** products page (above the order CTAs,
where trust matters most). The gift-box page (Idea 1) reuses it later.

✅ APPROVED (2026-07-13): one component, two faces, per the
[design artifact](https://claude.ai/code/artifact/f12dfc8a-7da8-4cf2-bf78-e74389cc9e7a) —
**Option A card grid (collapsing to Option B swipeable strip on mobile)** as the
„Доволни клиенти" section on the main page, and **Option C compact trust bar**
above the order CTAs on the products page; all fed by the same `reviews.json`.

✅ **IMPLEMENTED 2026-08-02** — [`src/app/shared/happy-customers/`](src/app/shared/happy-customers/),
fed by [`src/data/reviews.json`](src/data/reviews.json) (shape in
[`src/app/models/review.model.ts`](src/app/models/review.model.ts), documented in
[`src/data/README.md`](src/data/README.md)) with 12 unit specs.
One component, one `variant` input: `"section"` on the main page (between the
gallery and the final CTA band) and `"bar"` on `/products` (above the sort
toolbar + grid, so it doesn't strand itself when a search returns nothing).
Option B's mobile strip is a **CSS-only** collapse of the same grid markup —
one markup path, not two. Both faces are confirmed present in the prerendered
static HTML. The two closing links reuse `GOOGLE_MAPS_PROFILE_URL` and
`GOOGLE_REVIEW_URL` from [`src/data/site-links.ts`](src/data/site-links.ts),
closing the loop with Idea 4. Star glyphs are `aria-hidden` and each is paired
with a `.visually-hidden` „Оценка N от 5 звезди" label (a spec enforces the
pairing). No schema.org review markup, per the caveat below.

⚠️ **Seeded with the design artifact's three sample reviews as placeholders**
(`totalCount: 3`) — replace them with the real Google reviews and the real total
before this is meant to persuade anyone.

**Structured data caveat** — ⚠️ deliberately **no** `schema.org` `Review`/
`AggregateRating` markup for these: Google's guidelines prohibit "self-serving"
review markup sourced from third-party sites (including Google itself); marking
them up risks a manual action. Display is visual-only; the *real* stars already
show on your Business Profile in search results.

**Workflow for adding a review** — copy text from Google Maps → add an entry to
`reviews.json` → commit (or ask Claude in a session: "add this review to the happy
customers section"). Low enough friction that a dedicated skill isn't warranted yet.

**Effort estimate:** M (data file + one component + two placements + styles).

---

## Idea 6 — 🔺 MakerWorld ↔ site ↔ blog: the cross-linking triangle

> Added 2026-10-11. Status: **⬜ proposed — design artifact not yet produced.**

### Polished concept

Every model published on [MakerWorld](https://makerworld.com) becomes the corner
of a **triangle of three pages that all link to each other**:

```
            MakerWorld model page
           ↗                    ↖
  „Как направих…“ article  ↔  product card on /products
```

- **Site → MakerWorld** already works (see below). The hard part is the other way.
- **MakerWorld → site** is what brings traffic. MakerWorld visitors are exactly the
  target audience: people who care about 3D prints and might want one ready-made.
- **Blog article per model** is the only page Google can rank for that specific
  model. Products have no pages of their own (there is only `/products`).

This is probably the strongest of the growth ideas. Most of it costs no code: the
site side is mostly done, and the MakerWorld side is copy you paste in when you
upload a model.

### What exists today (verified 2026-10-11)

- `ProductVariant.links?: ProductLink[]`
  ([`product.model.ts`](src/app/models/product.model.ts)) renders external
  `igx-icon` buttons with tooltips in the card's top row
  ([`product-grid.component.html:64`](src/app/shared/product-grid/product-grid.component.html#L64)).
  `jewelry-stand-watches` already uses it („Виж модела в MakerWorld“). **Adding the
  link for a new model is a data change only**, with no code. `/add-product` can
  set it.
- Every product card has a stable `#linkId` deep link (`/products/#<linkId>`), so
  it can be the landing target for an article or for MakerWorld.
- GA4 (`G-YBR644GQL9`) is installed, so UTM-tagged visits show up with no extra setup.
- The `/products/` canonical is a hard-coded clean URL in
  [`products-page.component.ts`](src/app/products-page/products-page.component.ts),
  so `?utm_…` query strings **don't** create duplicate-content URLs.
- **Gap:** there is **no site-wide `Organization`/`LocalBusiness` JSON-LD** at all.
  Structured data exists only per blog post (`BlogPosting` via
  `SeoService.setStructuredData`), so there is no `sameAs` to add MakerWorld to yet.
- **Gap:** product cards don't link to blog articles, and articles don't
  systematically link back to product cards.

### The design, in four parts

**Part A — Site → MakerWorld (done, data only).** Keep using `links` in
[`products.json`](src/data/products.json). Optional polish: a recognisable
MakerWorld glyph instead of the generic `open_in_new`. Register it once as a custom
`igx-icon` SVG via `IgxIconService` (still an `igx-icon`, per Rule 1).

**Part B — MakerWorld → site (no code, done on MakerWorld).**

1. **Every model description ends with a call to action to the site**, in a fixed
   bilingual template. MakerWorld's audience is international, so a Bulgarian-only
   line would reach only part of it:
   ```
   🇧🇬 Готов отпечатан вариант можеш да поръчаш на 3dpechat.bg → <URL>
   🇬🇧 Want it printed and shipped in Bulgaria? Order at 3dpechat.bg → <URL>
   📖 How I designed it: <article URL>
   ```
2. **The profile bio links to the site** (homepage, with UTM).
3. **UTM convention, so GA4 shows exactly which model sends visits.**
   🔵 DECISION: `utm_campaign` = the product's `linkId`, so analytics rows map 1:1
   to `products.json` entries:
   ```
   https://3dpechat.bg/products/?utm_source=makerworld&utm_medium=referral&utm_campaign=jewelry-stand-watches#jewelry-stand-watches
   https://3dpechat.bg/?utm_source=makerworld&utm_medium=profile&utm_campaign=bio
   ```
   (The query string must come **before** the `#fragment`, or browsers drop it.)
4. **Honest expectations:** MakerWorld outbound links are almost certainly
   `nofollow`, so they pass little or no ranking signal in Google. The value is
   **referral traffic from a highly relevant audience**, not SEO link equity. Judge
   it by GA4 sessions per campaign, not by rankings.

**Part C — „Как направих…“ article per model (the SEO part).**

- One first-person blog post per MakerWorld model: the idea, design process and CAD
  tool, print settings (layer height, infill, supports), filament, print time,
  failures and fixes, and real photos.
- **This is the E-E-A-T signal Google rewards:** original, first-hand experience
  that nobody else can write. It also catches long-tail searches for that specific
  model or use case („стойка за часовници 3D печат“).
- **Each article links to both other corners:** the product card
  (`/products/#<linkId>`, an internal `routerLink` with the canonical trailing
  slash, so it is followed and crawlable) and the MakerWorld model page.
- 🔵 DECISION: **these articles are not generated by the auto-blog pipeline.**
  Their whole value is the maker's real data and photos. Generic AI copy would throw
  away the E-E-A-T advantage. Claude can draft from facts and photos you supply
  (print settings straight from the Bambu Studio project, photos from the printer),
  and you approve the wording, the same pattern as `/add-product`.
- **Product → article link:** add an optional `article` field to `ProductVariant`
  (the blog slug). The card renders it as an **internal** link („Как го направих“).
  🔵 DECISION: a separate field, not another `links` entry. `links` are external
  (new tab, `noopener noreferrer`). An article link must be an internal
  `routerLink` so it stays in the SPA and passes internal link equity.
- **Article → product/MakerWorld block:** a small reusable „Моделът“ card at the
  end of each article (`igx-card` with the product photo, an
  `igxButton="contained"` „Поръчай готов“ → product card, and an
  `igxButton="outlined"` „Свали от MakerWorld“). It is fed by the product's
  `linkId`, so the article never duplicates product data.
- No `Product`/`Review` rich-result markup on the article. It stays `BlogPosting`.
  Product markup belongs on a page that sells the product.

**Part D — brand presence (MakerWorld as an official profile).**

- `MAKERWORLD_PROFILE_URL` (`https://makerworld.com/en/@zdkolev`) in [`src/data/site-links.ts`](src/data/site-links.ts),
  next to the Google links, as the single source for every placement.
- MakerWorld icon link in the **footer** (next to Instagram) and on the **contact
  page**, using the same `igx-icon` + `igxTooltip` pattern as the existing social
  links.
- **New site-wide `LocalBusiness` JSON-LD** with
  `sameAs: [Instagram, Google Maps profile, MakerWorld, …]`. It goes **statically
  into `index.html` and `404.html`** (kept in sync, per the standing rule), not
  through `SeoService.setStructuredData`. That method uses one fixed script id, so
  each blog post's `BlogPosting` would overwrite it. `sameAs` helps Google connect
  the brand's profiles into one entity.

### Data: hand-curated JSON, no scraping (Rule 4)

🔵 DECISION: **no new data file.** `products.json` is already the model registry:
the MakerWorld URL lives in `links`, the article slug in the new `article` field,
and the profile URL in `site-links.ts`. Nothing is fetched from MakerWorld at build
time or at runtime. It would break Rule 4, MakerWorld blocks automated requests
anyway, and a runtime fetch would also need a CSP `connect-src` hole. Download
counts and likes are **not** mirrored onto the site. They would go stale silently,
and they are MakerWorld's metric, not ours.

*If a model ever exists on MakerWorld without being a sellable product, revisit
this: an `available: false` product entry or a small `makerworld.json`.*

### The per-model publishing loop (the workflow this enables)

1. Print and photograph the model.
2. `/add-product` with the photos, including the MakerWorld link (or leave it empty
   until step 3).
3. Upload to MakerWorld. Paste the description template with UTM links (Part B).
4. Write the „Как направих…“ article from real print data and photos (Part C), and
   set `article` on the product.
5. Go back to MakerWorld and fill in the article URL in the description. The
   triangle is now closed.
6. `npm run generate-sitemap`, PR, merge.

*Later:* extend `/add-product` (or add a sibling `/maker-story` skill) to run steps
2–5 as one guided flow: ask for the MakerWorld URL, print settings and filament,
draft the article and the MakerWorld description text with UTM links already built.

### Options considered and rejected

- **Per-product pages (`/products/<linkId>/`)** would give each model its own
  indexable page, but with ~12 short product entries they would be thin pages that
  repeat the card. The article is a richer page for the same purpose. Rejected for
  now. Revisit if the catalog grows large or products get long-form descriptions.
- **Syncing model data or stats from MakerWorld** breaks Rule 4, is blocked by
  MakerWorld, and the data would go stale. Rejected.
- **Generating the articles with the auto-blog pipeline** throws away the
  first-hand-experience value that is the point of the articles. Rejected. Claude
  drafts only from facts you provide.

### Open questions

- ~~MakerWorld profile URL / handle~~ ✅ **Resolved 2026-10-11:** Zdravko provided
  the profile URL, used for Part D (`MAKERWORLD_PROFILE_URL`) and the bio:
  ```
  https://makerworld.com/en/@zdkolev
  ```
- Which models to start with. Suggestion: the jewelry stand, since it is already
  on MakerWorld and already linked from its card.

**Effort estimate:** Part B ≈ XS (copy + convention, no code). Part D ≈ S. Part C
≈ S–M for the `article` field, the card link and the reusable „Моделът“ block,
then ~1 h of your time per article. User-facing parts (the footer/contact icon, the
card's article link, the „Моделът“ block) need a **design artifact first** (Rule 2).
https://claude.ai/artifact/XcjDAuDJcofVADh3iRJa47?sk=36GmReEBE2qzDuvpfj_34A#page-dcb81aee8d83

---

## How the ideas reinforce each other

- **Idea 3 Phase 1 (products.json) ships first** — it's the foundation: Idea 1's
  gift box is then added *via* the new workflow as its first real test.
- **Idea 2's manifest pattern** is the same philosophy as products.json: curated
  JSON data + generator script + git as source of truth. Same mental model, same
  review-diff-commit-deploy loop everywhere.
- The gift box page later gets an "example boxes" gallery managed by the Idea 2
  manifest system.
- **Ideas 4 and 5 are two halves of one review loop:** the CTA (4) generates
  reviews, the Happy Customers section (5) showcases them — and the section itself
  ends with the CTA link, feeding the loop. Both share one constant (the direct
  review link) and Idea 5 follows the same curated-JSON pattern as Ideas 2 and 3.
- The contact-form success prompt (4) fires for gift-box orders (1) too, so the
  most delighted customers — surprise-gift recipients' buyers — get asked at the
  perfect moment.
- **Idea 6 builds on Idea 3:** `products.json` is the model registry, `/add-product`
  already sets the MakerWorld `links`, and the per-model publishing loop starts
  with that skill. The „Как направих…“ articles also give the gift box (1) and the
  catalog real stories to link to.

## 🎨 Design artifacts — visual variants per idea

Part of the workflow: **before implementing any user-facing idea, a design artifact
showing 2–4 visual/UX variants is produced and reviewed** (same format as the
earlier "Header Spacing + Theme Toggle" artifact: 3DPechat.bg-branded mockups,
light/dark, recommended option marked). Implementation follows the approved
variant. All five were produced and **approved by Zdravko on 2026-07-13**:

| Idea | Artifact | Variants shown | ✅ Approved choice |
|------|----------|----------------|--------------------|
| 1 · Gift box | [🎁 Gift Box Configurator](https://claude.ai/code/artifact/e96da4a9-0f8e-4fa1-83f6-ce952afce78b) | A step wizard · B single page + summary rail · C playful box-builder | **B — single page + live summary rail** |
| 2 · Gallery ordering | [🖼️ Gallery Order Editor](https://claude.ai/code/artifact/a5a929ca-1249-426f-9527-28ede18696fa) | manifest format + A drag-drop grid · B arrow list · C filmstrip | **manifest + A — thumbnail grid with drag-and-drop** |
| 3 · Add product | [📦 Add-Product Workflow](https://claude.ai/code/artifact/ab13e0a6-9cd6-4dde-aff8-da814ecce42b) | A Claude skill (terminal flow) · B GitHub issue form · C git-CMS /admin | **A + B, both mandatory** — A gains pasted-image input; B gets an owner-only (`zdrawku`) guard; C rejected |
| 4 · Review CTA | [⭐ Google Review CTA](https://claude.ai/code/artifact/1e006177-f26d-48e2-a41c-493e64bd1270) | A footer block · B contact-success prompt · C snackbar · D modal (rejected) | **all three layers (A+B+C)**; D stays rejected |
| 5 · Happy customers | [💬 Happy Customers Section](https://claude.ai/code/artifact/f12dfc8a-7da8-4cf2-bf78-e74389cc9e7a) | A card grid · B mobile carousel · C compact trust bar | **A (collapsing to B on mobile) on main page + C trust bar on products page**, one component, one `reviews.json` |
| Hero print animation | [🖨️ Hero анимация — 3D печат ефекти](https://claude.ai/code/artifact/c107c8e6-da1d-4b48-a233-d86443f30e9c) | 6 base effects + combined 7А/7Б/7В/7Г (violet SLA beam × nozzle color × fine-layer steps × shuttle range) | **7Г — violet beam rises bottom-up in 34 fine steps, orange nozzle shuttles only over the printer area; loops infinitely, 7s per cycle** ✅ implemented 2026-07-14 |
| Card hover effect | [🖨️ Hero анимация — 3D печат ефекти](https://claude.ai/code/artifact/c107c8e6-da1d-4b48-a233-d86443f30e9c) (hover section) | full SLA sweep → subtler → no transform, unified across elements | **Faint violet beam sweeps bottom-up once per hover-enter + soft shadow deepen; no movement. Identical on `prop_card`, `process_step`, `.masonry-item`, `.tier-card` via `src/app/_sla-hover.scss` mixin (tier-card uses inner `.sla-sweep` layer so the featured badge isn't clipped)** ✅ implemented 2026-07-14 |

To iterate on any of them, ask Claude to update the artifact — same link is kept.

**Suggested build order:**

| # | Work item | Idea | Size | Status |
|---|-----------|------|------|--------|
| 1 | Extract `products.json` + model file | 3.1 | S | ✅ done |
| 2 | Manifest + sync rewrite of `generate-carousel-images.js` | 2.1–2.2 | S | ✅ done |
| 3 | Review CTA layers (footer + contact success + snackbar) | 4 | S–M | ✅ done 2026-07-31 |
| 4 | `reviews.json` + Happy Customers section | 5 | M | ✅ done 2026-08-02 |
| 5 | `/add-product` skill | 3.2 | M | ✅ done 2026-07-31 |
| 6 | Gift box product + `/gift-box` configurator page | 1 | M | ⬜ |
| 7 | Local drag-drop gallery editor | 2.3 | M | ✅ done |
| 8 | Issue-form add-from-phone flow (owner-only guard) | 3.3 | M | ✅ done 2026-07-31 |
| 9 | (Optional) Gift box unboxing gallery, blog post | 1 | S | ⬜ |
| 10 | MakerWorld description template + UTM convention (off-site, no code) | 6B | XS | ⬜ |
| 11 | Design artifact: MakerWorld icon, card article link, „Моделът“ block | 6 | S | ⬜ |
| 12 | `MAKERWORLD_PROFILE_URL` + footer/contact icon + static `LocalBusiness` JSON-LD with `sameAs` | 6D | S | ⬜ |
| 13 | `article` field on products + card link + reusable „Моделът“ block | 6C | S–M | ⬜ |
| 14 | First „Как направих…“ article (jewelry stand), close the triangle | 6C | S | ⬜ |
| 15 | (Optional) extend `/add-product` / `/maker-story` skill for the full loop | 6 | M | ⬜ |

*(Items 3–4 jumped the queue vs. the original order: they're small, independent of
the JSON refactor, and reviews compound over time — the sooner the CTA ships, the
more reviews exist when everything else launches.)*

---

## 📋 Decisions — review & revise list

Originally made autonomously; **variant choices confirmed by Zdravko on
2026-07-13** (see the Design artifacts table). None are implemented yet.

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
   ✅ Approved, extended per Zdravko: the skill must also accept **images pasted
   directly into the skill call**, not only folder paths.
10. ~~Phone-based product adding deferred~~ **Superseded by Zdravko (2026-07-13):
    the GitHub Issue form + Action flow is MANDATORY**, with an owner-only guard —
    the Action runs only when the issue author is `zdrawku` (job-level `if` on
    `github.event.issue.user.login`, fail-closed for everyone else), and the
    result is still a PR that only you can merge.
11. **Build order** as in the table above — foundations (json extraction, manifest)
    before features (gift box, editor), with the small review-loop items (4, 5)
    slotted early because reviews compound over time.
12. **Review CTA uses the direct write-review link**, not the originally proposed
    `google.com/search?q=3dpechat` search URL. ✅ *Blocker resolved 2026-07-13 —
    Zdravko provided Place ID `ChIJZ512pmOFqkARSxCaV9bE1og`, so the link is:*
    `https://search.google.com/local/writereview?placeid=ChIJZ512pmOFqkARSxCaV9bE1og`
    *No open blockers remain in this plan.*
13. **Review CTA = three quiet layers** (footer link on every page, prominent
    button on contact-form success, one-time snackbar with 30-day localStorage
    cool-down) — **no modal dialogs, no exit-intent popups**, to avoid annoying
    visitors and Google's mobile intrusive-interstitial SEO penalty. *(Revise if
    you want something louder.)*
14. **Happy Customers reviews are hand-curated in `src/data/reviews.json`**, not
    auto-synced: third-party widgets (external scripts, paywalls, performance
    cost) and the Places API (only 5 uncontrollable reviews, billing key) were
    both rejected. *(Revise if you'd rather have auto-updating reviews and accept
    a third-party script.)*
15. **Happy Customers placement:** main page + products page; **no schema.org
    review markup** for Google-sourced reviews (prohibited as self-serving —
    risks a manual penalty), display only.
16. **Design-first workflow adopted:** every user-facing idea gets a variants
    artifact before implementation (all five produced — see the "Design
    artifacts" table above). ✅ **All variant choices approved by Zdravko on
    2026-07-13:** gift box **B** (single page + summary rail), gallery editor
    **manifest + A** (drag-drop grid), add-product **A + B both mandatory**
    (pasted-image input; owner-only issue guard), review CTA **all three layers**,
    happy customers **A/B on main page + C trust bar on products page**.
17. *(Idea 6, proposed 2026-10-11, not yet approved)* **MakerWorld data stays
    hand-curated:** no new data file. The MakerWorld URL lives in the product's
    `links` field, the article slug in a new `article` field, and the profile URL
    in `site-links.ts`. No scraping or syncing of stats.
18. **UTM convention:** `utm_source=makerworld`, `utm_medium=referral|profile`,
    `utm_campaign=<linkId>`, so GA4 maps 1:1 to products.
19. **„Как направих…“ articles are written from the maker's real data**, not by
    the auto-blog pipeline. That first-hand experience is their E-E-A-T value.
20. **The product → article link is an internal `routerLink`** (new `article`
    field), not an external `links` entry.
21. **Site-wide `LocalBusiness` JSON-LD goes static into `index.html`/`404.html`**,
    because `SeoService.setStructuredData` uses one script id that blog posts
    would overwrite.
22. **No per-product pages for now.** Articles are the indexable page per model.
    *(Revise if the catalog grows large.)*

### Sources (Ideas 4–5 research)

- [Broadly — Best tactics for asking for Google reviews](https://broadly.com/blog/best-tactics-for-asking-for-reviews-on-google/)
- [nSight — Review pop-ups without violating Google GBP policies](https://www.nsightperformancegroup.com/post/smart-pop-ups-local-reviews-ugc-without-violating-google-gbp-policies)
- [EmbedSocial — How to get your Google review link](https://embedsocial.com/blog/google-review-link/)
- [EmbedSocial — Embedding Google reviews options](https://embedsocial.com/blog/embed-google-reviews/)
- [Jotform — Google review widget comparison](https://www.jotform.com/blog/widgets-for-google-reviews/)
- [SocialPilot — Methods to embed Google reviews](https://www.socialpilot.co/reviews/blogs/embed-google-reviews)
- [Local Search Forum — Direct link to leave a Google review](https://localsearchforum.com/threads/how-to-find-a-direct-link-to-leave-a-google-review-for-your-business.54662/)

