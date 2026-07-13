# Gallery manifests — image order, alt text & hiding

**The core loop**

1. Edit manifest.json  (reorder / caption / hide)
2. npm run generate-images   → rewrites carousel-images.ts from the manifest
3. Review the git diff, commit
The array order is the display order. Top of the array = first image shown.

**The three things you can do:**
① Reorder — cut/paste whole { ... } blocks up or down. Whatever's first in the array shows first.

② Caption (alt) — fill in the empty "alt": "". This is the accessibility/SEO text and it's currently blank on all 24.

③ Hide — set "hidden": true to pull an image off the site without deleting the file.

**Adding new images — the key behavior you asked about**
When you drop a new photo into the folder and run npm run generate-images, the sync script appends it to the bottom of the manifest — it never disturbs your existing order. So your curation is safe. Then you just move that new bottom entry up to wherever you want it.




The homepage carousel (`first-page-images/`) and the portfolio masonry gallery
(`general-images/`) are **not** ordered by filename. Each of those folders owns a
co-located `manifest.json` that is the **source of truth** for:

- **display order** — the array order in the manifest *is* the on-screen order;
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

## The sync script (`npm run generate-images`)

`scripts/generate-carousel-images.js` reconciles each folder with its manifest,
then regenerates the `carousel-images.ts` the Angular components import
(`main-page/` and `portfolio-page/`). It runs automatically on `prestart` /
`prebuild`. Rules:

- **New files on disk** are appended to the **end** of the manifest (never lost,
  never reordered above existing entries) — so "just drop photos in the folder"
  still works; they appear last.
- **Deleted files** are dropped from the manifest.
- **Existing entries** keep their order, `alt`, and `hidden` exactly as authored.
- **First run** (no manifest) seeds it in alphabetical order — matching the old
  behavior, so nothing visibly changes until you reorder on purpose.

The script is idempotent: running it twice with no disk change is a no-op.

## How to reorder / caption / hide

Edit `manifest.json` directly (reorder the array, set `alt`, flip `hidden`) and
run `npm run generate-images`, then review the diff and commit. A local
drag-and-drop editor (`npm run gallery-editor`) is planned to make this visual.

> `manifest.json` is a **build-time source file** — it is excluded from the
> deployed `assets/` (see `angular.json`), so it never ships to visitors.

> ⚠️ These captions are Bulgarian (Cyrillic). Edit with a UTF-8-aware tool; do
> not bulk-edit via Windows PowerShell 5.1 (it corrupts the text).
