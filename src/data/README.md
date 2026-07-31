# `src/data/` — curated JSON data (git is the source of truth)

This folder holds hand-curated data files that are **imported at build time**
(not fetched over HTTP at runtime). Build-time import keeps the SSR-prerendered
HTML complete — product names, etc. end up in the static output, which matters
for SEO/indexing. The trade-off (a rebuild/deploy is needed to publish a change)
is a non-issue: publishing new images already requires a deploy.

## `products.json` — the product catalog

Every product on `/products` comes from this file. It is an array of `Product`
objects; the shape is defined in
[`src/app/models/product.model.ts`](../app/models/product.model.ts) and consumed
by [`products-page.component.ts`](../app/products-page/products-page.component.ts),
which maps each entry to a runtime `ProductVariant` by adding `showFront: true`.

### Fields

| Field            | Required | Notes                                                                 |
|------------------|----------|-----------------------------------------------------------------------|
| `id`             | ✅       | Unique number. Existing ids have gaps (no `3`, `5`) — do **not** renumber; just use the next free integer. |
| `linkId`         | ✅       | Stable kebab-case slug. Used as the card's DOM id for `#deep-links` and the copy-link button — **changing it breaks shared links.** |
| `name`           | ✅       | Bulgarian product title (card heading).                               |
| `description`    | ✅       | Bulgarian description.                                                 |
| `frontImage`     | –        | Path like `/assets/real-images/…​.webp`. Convert images to `.webp` first (see `scripts/convert-images-to-webp.js`). |
| `backImage`      | –        | Optional second side; enables the flip UI when present.               |
| `dateAdded`      | –        | `YYYY-MM-DD`. Drives the newest/oldest sort. Set to the day you add it. |
| `hasOldCoins`    | ✅       | `true`/`false` (coin-card metadata).                                  |
| `hasEuroCoins`   | ✅       | `true`/`false` (coin-card metadata).                                  |
| `hasImagePadding`| –        | `true` adds padding around the image in the card.                     |
| `featured`       | –        | **MAIN product.** `true` pins it as a banner at the top of `/products` and surfaces it as a child item under „Продукти“ in the nav drawer. |
| `pageUrl`        | –        | Gives the product its own page (e.g. `/gift-box`) instead of the default „order via `/contact`“ prefill flow. Used with `featured` for MAIN products. |
| `customContent`  | –        | `{ show, title, items[] }` — an extra bulleted info tooltip on the card. |
| `tags`           | –        | Bulgarian keywords; searchable and shown as chips (first 3, then `+N`). |
| `links`          | –        | External references shown as icon buttons in the card's top row: `[{ label, url, icon? }]`. E.g. a MakerWorld/Printables model page. `label` is the tooltip/aria text; `icon` is an optional Material icon name (defaults to `open_in_new`). Opened in a new tab with `rel="noopener noreferrer"`. |

> `showFront` is **not** a data field — it is runtime UI state added by the
> component. Don't put it in the JSON.

### Add a product manually

1. Convert the photos to `.webp` and place them under `src/assets/real-images/`.
2. Append an object to `products.json` with the fields above (next free `id`,
   a fresh `linkId`, today's `dateAdded`, valid Bulgarian `name`/`description`).
3. `npm run build` to validate (strict typing will reject a malformed entry).
4. Review the diff and commit.

For a MAIN product (like the gift box), also set `featured: true` and `pageUrl`,
and add the matching page component/route.

### Add a product automatically (preferred)

Two automated routes exist — both end in a PR you review and merge:

- **From your PC — the `/add-product` Claude Code skill**
  ([`.claude/skills/add-product/SKILL.md`](../../.claude/skills/add-product/SKILL.md)).
  Say `/add-product`, paste the photos straight into the chat (or give a folder
  path) plus a one-line brief; it converts the images, drafts the Bulgarian
  copy + tags for your approval, appends the entry, builds, and opens the PR.
- **From your phone — the „📦 Нов продукт“ issue form**
  ([`.github/ISSUE_TEMPLATE/new-product.yml`](../../.github/ISSUE_TEMPLATE/new-product.yml)).
  Fill in the form, drag in the photos;
  [`add-product.yml`](../../.github/workflows/add-product.yml) runs
  [`scripts/add-product/from-issue.js`](../../scripts/add-product/from-issue.js)
  and opens the PR. Owner-only: the workflow refuses to run unless the issue
  author is `zdrawku` *and* GitHub reports them as `OWNER`; anyone else's issue
  is commented on and closed without any code running.

Both share [`scripts/add-product/lib.js`](../../scripts/add-product/lib.js),
which owns id/`linkId`/`dateAdded` generation, webp conversion, and the
append-without-reformatting write.

### ⚠️ Encoding note

These files contain Bulgarian (Cyrillic) text. Edit them with a UTF-8-aware
editor/tool. Do **not** bulk-edit them via Windows PowerShell 5.1 — it re-encodes
and corrupts the Cyrillic.
