---
name: add-product
description: Add a new product to the 3dpechat.bg catalog from photos plus a one-line brief. Converts images to webp, drafts the Bulgarian name/description/tags for approval, appends the entry to src/data/products.json, builds, and opens a PR. Use when the user says "/add-product", "add a product", "качи нов продукт", or supplies product photos to publish.
---

# Add a product to the catalog

Turns *photos + a one-line brief* into a reviewed PR that adds a product to
`/products`. The site is fully static: products live in `src/data/products.json`
and are imported at build time, so publishing = merging a PR.

## Inputs you accept

Images arrive in **either** form — support both:

1. **Pasted/attached directly into the chat.** Claude Code writes attached
   images to a temp path; use that path as the source. This is the common case
   ("here are 2 photos" + paste).
2. **A folder or file path** (e.g. `~/Downloads`, `C:\Users\ZKolev\Downloads\a.jpg`).
   If given a folder, list image files in it and confirm which ones to use.

Plus a brief from the user: what the thing is, roughly. Anything else
(`name`, `description`, `tags`, `featured`, MakerWorld link…) is optional — you
draft it and they approve.

## Steps

### 1. Gather and confirm inputs

Identify the source images. Ask which is the **front** image (the card's primary
face) and which, if any, is the **back** (enables the card flip). Two images ⇒
front + back; one ⇒ front only; more than two ⇒ ask which two to use.

Read `src/data/README.md` for the current field reference before writing
anything — it is the authority on the data shape.

### 2. Draft the Bulgarian copy — then STOP for approval

From the photos and the brief, draft:

- `name` — Bulgarian product title, concrete and searchable (not "Продукт 1").
- `description` — 1–2 Bulgarian sentences: what it is, what it's for, material
  or notable detail if visible.
- `tags` — 5–10 Bulgarian keywords buyers would actually search
  (object, use case, room, occasion, "подарък" when it fits).

Match the tone of existing entries in `products.json` — warm, plain, no
marketing hyperbole. **Show the drafted copy to the user and get explicit
approval before saving.** They may edit any field.

Bulgarian text is non-negotiable here: the whole site is in Bulgarian.

### 3. Convert the images

Use the shared helper — do not hand-roll sharp calls:

```js
const lib = require('./scripts/add-product/lib.js');
const products = lib.readProducts();
const slug = lib.slugify(name); // used as the image base name too
const frontImage = await lib.convertImage(frontSourcePath, slug);
const backImage  = await lib.convertImage(backSourcePath, `${slug}-back`);
```

`convertImage` bakes in EXIF rotation, caps width at 1920px, and writes
quality-80 `.webp` into `src/assets/real-images/`, matching
`scripts/convert-images-to-webp.js`.

### 4. Append the entry

```js
const entry = lib.buildProduct(products, {
  name, description, frontImage, backImage, tags,
  // optional: hasImagePadding, featured, pageUrl, customContent, links
});
lib.appendProduct(entry);
```

`buildProduct` assigns the next free `id`, transliterates a unique `linkId`, and
stamps `dateAdded`. `appendProduct` appends **without reformatting** the rest of
the file, so the diff shows only the new product.

⚠️ **Never edit `products.json` through PowerShell 5.1** — it re-encodes and
corrupts the Cyrillic. Use these Node helpers or a UTF-8-aware editor.

### 5. Validate

```
npm run build
```

Strict typing rejects a malformed entry. Fix anything it reports before
continuing. If the build is clean, also sanity-check that the new images exist
at the paths written into the JSON.

### 6. Show the diff, then open a PR

Show `git diff` and the new image files to the user. On their go-ahead:

```
git checkout -b add-product/<linkId>
git add src/data/products.json src/assets/real-images
git commit
gh pr create
```

Commit message: `feat(products): add <name>`. PR body should list the product
name, its `linkId`, and the images added, plus a short review checklist
(Bulgarian copy reads well, images correct side, tags sensible).

Merging deploys automatically via `.github/workflows/github-pages.yml`.

## Notes

- **Any UI you build must use Ignite UI Angular components** (`igx-card`,
  `igxButton`, `igx-icon`, `igx-avatar`, …) — never hand-rolled plain HTML.
  See Rule 1 in [`CLAUDE.md`](../../../CLAUDE.md), including the
  `$exclude-components` trap and the standalone-`imports:` requirement. This
  skill itself only writes JSON + images, so it normally doesn't apply — but it
  does the moment you build the page component below.
- **MAIN products.** If the user says this is a flagship/main product, set
  `featured: true` (pins it as a banner at the top of `/products` and adds a
  child item under „Продукти“ in the nav drawer). If it needs its own page
  rather than the default „order via /contact“ flow, also set `pageUrl` — and
  tell the user that page component + route still has to be built separately
  (built with Ignite UI components, per the rule above).
- **`linkId` is permanent.** It is the card's DOM id and the target of shared
  `#deep-links`. Never change an existing one.
- **Coin metadata.** `hasOldCoins`/`hasEuroCoins` are coin-card specific; leave
  both `false` for everything else.
- The alternative phone-based route is the GitHub Issue form
  (`.github/ISSUE_TEMPLATE/new-product.yml`), which runs the same append logic
  via `scripts/add-product/from-issue.js`.
