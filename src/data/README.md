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

## `reviews.json` — the „Доволни клиенти" curated reviews

Hand-picked Google reviews shown by
[`HappyCustomersComponent`](../app/shared/happy-customers/happy-customers.component.ts)
on the main page (card grid, collapsing to a swipeable strip on mobile) and on
`/products` (compact trust bar above the order CTAs). The shape is defined in
[`src/app/models/review.model.ts`](../app/models/review.model.ts).

Deliberately **curated, not synced**: no third-party widget script (performance,
GDPR, paywalls) and no Places API key (returns only 5 uncontrollable reviews and
needs billing). It's a hall of fame, so going "stale" is the intent.

### Fields

| Field           | Required | Notes                                                            |
|-----------------|----------|------------------------------------------------------------------|
| `totalCount`    | ✅       | Total reviews on the Business Profile — drives „N ревюта" in the header. Separate from `reviews.length`, since only a subset is displayed. |
| `averageRating` | ✅       | Overall rating on the profile, e.g. `5`.                          |
| `reviews[]`     | ✅       | **Array order is display order.**                                 |
| ↳ `author`      | ✅       | Abbreviated name, e.g. „Иван П.". Drives the coloured initial circle. |
| ↳ `rating`      | ✅       | 1–5.                                                              |
| ↳ `date`        | ✅       | `YYYY-MM` (rendered as „май 2026"). A malformed value falls back to the raw string. |
| ↳ `text`        | ✅       | Review text **without** quote marks — the UI adds them.           |
| ↳ `sourceUrl`   | –        | Optional deep link to the review on Google Maps.                  |
| ↳ `featured`    | ✅       | Only `true` entries are rendered.                                 |

### Add a review

Copy the text from Google Maps → append an entry (or reorder to promote one) →
bump `totalCount` if the profile's total changed → commit. Or just ask Claude in
a session: *"add this review to the happy customers section"*.

Current contents: the 8 real Google reviews as of 2026-08-02 (all 5★). One of
the 8 is rating-only with no text, so it is not listed — `totalCount` stays 8
because it still counts on the profile. The three `featured: true` entries are
the ones shown in the section; the rest are kept so promoting one later is just
a flag flip.

**Trimming is allowed, rewriting is not.** A long review may be cut to its
strongest sentences so the cards stay balanced (Alexander Atanasov's is trimmed
this way), but the remaining words must be *verbatim* — never paraphrase,
never improve a customer's wording, and never change the sentiment.

> ⚠️ **Never add schema.org `Review`/`AggregateRating` markup for these.** Google
> prohibits self-serving review markup sourced from third-party sites (including
> Google itself) and it risks a manual action. The section is display-only; the
> real stars already show on the Business Profile in search results.

### ⚠️ Encoding note

These files contain Bulgarian (Cyrillic) text. Edit them with a UTF-8-aware
editor/tool. Do **not** bulk-edit them via Windows PowerShell 5.1 — it re-encodes
and corrupts the Cyrillic.
