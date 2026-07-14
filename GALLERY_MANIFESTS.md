# Gallery manifests — image order, alt text & hiding

The homepage carousel (`first-page-images/`) and the portfolio masonry gallery
(`general-images/`) are **not** ordered by filename. Each of those folders owns a
co-located `manifest.json` that is the **source of truth** for:

- **display order** — the array order in the manifest *is* the on-screen order
  (top of the array = first image shown);
- **`alt`** — per-image alt text (accessibility + SEO). Empty string = fall back
  to a generic „3D печат проект N“ label in the template;
- **`hidden`** — `true` keeps a file in the folder but out of the site (no need to
  delete it).

```json
{
  "images": [
    { "file": "20260104_134937.webp", "alt": "3D принтирана ваза", "hidden": false },
    { "file": "0.webp", "alt": "", "hidden": true }
  ]
}
```

There are two ways to edit a gallery: the **visual editor** (recommended) or by
**hand-editing `manifest.json`**. Both end the same way — review the git diff and
commit.

---

## Option 1 — The visual editor (recommended): `npm run gallery-editor`

A local, dev-only maker tool. It never deploys and needs no login — it binds to
`127.0.0.1` and only edits the two gallery folders.

```bash
npm run gallery-editor
# → open http://localhost:4747
```

In the browser you get a thumbnail grid per gallery with:

- **Reorder** — drag a thumbnail onto another, or use the **← / →** buttons on each
  card. The position badge (top-left) shows the live order.
- **Caption** — type Bulgarian `alt` text in each card's box.
- **Hide / show** — the „Скрий“ checkbox; hidden images dim and drop out of the
  count (they stay on disk).
- **Save** — the „Запази“ button (enabled only when there are unsaved changes)
  writes the folder's `manifest.json` **and** regenerates `carousel-images.ts` in
  one step. A toast confirms it.

Switch galleries with the tabs at the top. Then review the diff and commit.
`Ctrl+C` in the terminal stops the server.

> The editor writes UTF-8, so Bulgarian captions are safe. It only ever writes
> `manifest.json` inside the two gallery folders and re-runs the sync script —
> nothing else on disk is touched.

---

## Option 2 — Hand-edit `manifest.json`, then sync

1. Open the folder's `manifest.json` and edit the array:
   - **Reorder** — cut/paste whole `{ ... }` blocks up or down.
   - **Caption** — fill in `"alt": "…"`.
   - **Hide** — set `"hidden": true`.
2. `npm run generate-images` — rewrites `carousel-images.ts` from the manifest.
3. Review the diff and commit.

---

## Adding new images

Drop the new `.webp` into the folder and run `npm run generate-images` (or open
the editor — it lists on-disk files that aren't in the manifest yet). **New files
are appended to the END** of the manifest — your existing order, captions and
hidden flags are never disturbed. Then move the new entry wherever you want it
(drag it up in the editor, or move its block in the JSON).

## The sync script (`npm run generate-images`)

`scripts/generate-carousel-images.js` reconciles each folder with its manifest,
then regenerates the `carousel-images.ts` the Angular components import
(`main-page/` and `portfolio-page/`). It runs automatically on `prestart` /
`prebuild`. Rules:

- **New files on disk** → appended to the end of the manifest (never lost, never
  reordered above existing entries).
- **Deleted files** → dropped from the manifest.
- **Existing entries** → order, `alt`, and `hidden` preserved as authored.
- **First run** (no manifest) → seeded in alphabetical order, so nothing visibly
  changes until you reorder on purpose.

The script is idempotent: running it twice with no disk change is a no-op.

> `manifest.json` is a **build-time source file** — it is excluded from the
> deployed `assets/` (see `angular.json`), so it never ships to visitors.

> ⚠️ These captions are Bulgarian (Cyrillic). Edit with a UTF-8-aware tool (the
> visual editor is safe); do not bulk-edit via Windows PowerShell 5.1 — it
> corrupts the text.
