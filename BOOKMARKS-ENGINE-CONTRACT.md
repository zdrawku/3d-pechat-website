# What the 3dpechat.bg website needs from `@printkit/bookmark-creator`

> Written for the agent building the engine package (`C:\Work\z\Bookmarks generator`).
> It **replaces section 8 of `WEBSITE_HANDOFF.md`** wherever the two differ; everything
> in section 8 that is not mentioned here still stands.
>
> The website side is finished against a stub. Its mirror of the contract is
> [`src/app/bookmarks/engine/engine.types.ts`](src/app/bookmarks/engine/engine.types.ts)
> (read it: it is the exact shape the page codes against) and the stub is
> [`stub-engine.ts`](src/app/bookmarks/engine/stub-engine.ts) (a throw-away sketch, **not** a
> reference for how a bookmark looks). Nothing here asks you to change the website.
>
> **MUST** = the page cannot work without it. **SHOULD** = the page works, but worse.
> **OPEN** = a decision for the package author (Zdravko).

## 0. What the page does, in one paragraph

The customer page (`/products/bookmarks/`, three modes) and the hidden Studio (`/studio/`)
call `createBookmarkEngine()` lazily in the browser, read every list from `options()`, call
`preview(request)` on each change (debounced 250 ms, latest wins), `suggestColours(picture)`
after an upload, and on checkout `createOrder(request, customer)` whose `file` (≤ `orderMaxBytes`)
is the **only** attachment of a Web3Forms email and whose `summary` is the email body. The
Studio additionally calls `readOrder(file)` and, lazily after unlocking, `/print`'s `build()`.
The site contains **no bookmark logic**; it can't compensate for anything the engine doesn't do.

## 1. Changes to the draft contract

### 1.1 MUST — different pictures in one set: `pictures`

```ts
interface BookmarkRequest {
  picture?: Blob;      // one bookmark, or one picture split across `split` bookmarks
  pictures?: Blob[];   // NEW — a set of DIFFERENT pictures: one bookmark per picture
  split?: number;      // only with `picture`
}
```

- Used **instead of** `picture` + `split`. The set has `pictures.length` bookmarks
  (`1 … options().set.max`). Never both `picture` and `pictures`.
- Each bookmark is built from its own picture: its own crop, its own colour map. The preview shows
  all of them side by side in one image.
- `names`: `[]` (none) or **exactly one entry per bookmark** (`''` = that bookmark unnamed).

### 1.2 MUST — hand-positioned pictures: `framing`

The visitor drags the picture inside the bookmark's shape (and zooms). The page sends numbers; the
**engine does the real crop** — what is dragged on the page must be what is printed.

```ts
interface Framing { x: number; y: number; zoom: number }   // x, y in 0…1; zoom in 1…4
interface BookmarkRequest { framing?: Framing[] }          // NEW — one entry per picture
```

Meaning (CSS-equivalent, and the page's editor and demo preview already use exactly this — see
[`src/app/bookmarks/framing.ts`](src/app/bookmarks/framing.ts)):

1. The **frame** is the bookmark's bounding box (width × height of the chosen size; for a
   `split`, the whole set's width × the height, the slices cut from it).
2. The picture is scaled to **cover** the frame (`background-size: cover`) and then multiplied by `zoom`.
3. `x`, `y` are `background-position` fractions: `0` = the picture's left/top edge touches the
   frame's, `1` = its right/bottom edge does, `0.5` = centred. So with picture box `W × H` in a
   frame `fw × fh`: `left = (fw − W) · x`, `top = (fh − H) · y`.
4. Missing `framing`, a missing entry, or `{ x: .5, y: .5, zoom: 1 }` = centred cover — what the engine
   presumably already does today.
5. One entry per picture: `picture` → `framing[0]`; `pictures[i]` → `framing[i]`; a `split` has one
   entry for the whole set.
6. Picture orientation: apply the picture's **EXIF orientation before** framing (phone photos).
   The page's editor shows the picture the way the browser shows it (already rotated).

Add a golden test: the same picture with `{x:0,y:0,zoom:1}` and `{x:1,y:1,zoom:2}` crops the expected
corners.

### 1.3 SHOULD — colours per picture

With `pictures`, one shared `colours` palette is wrong (a sunset and a forest need different
four colours). Additive and backward compatible:

```ts
interface BookmarkRequest { colours: Hex[]; pictureColours?: Hex[][] }   // pictureColours[i] for pictures[i]
```

- If `pictureColours[i]` is missing the engine uses `colours`. The page can send `colours` only for
  now and adopt `pictureColours` later with no engine change.
- `suggestColours(picture, count)` is already per picture.

### 1.4 MUST — `options()` carries every number the page would otherwise hard-code

```ts
interface EngineOptions {
  // … as in the draft, plus:
  pictureColours: number;   // NEW — how many colours a picture uses (the page has the constant 4 today)
  set: { min: number; max: number; splitCounts: number[] };   // see OPEN below
}
```

- **DECIDED — `set.max` is 4** (Zdravko, 2026-10-30; one print plate holds at most 4 bookmarks):
  `set: { min: 1, max: 4, splitCounts: [2, 3, 4] }` (`splitCounts` = every N a picture can be
  split into). The recipes may allow 5, but `options()` must say 4: the page offers exactly
  `options().set.max` different pictures, one name per bookmark up to the same number, and
  `splitCounts` for a split. A set of 4 must work everywhere: `preview` (one image, four
  bookmarks), `createOrder` (four maps within the size budget of 1.6) and the print layout
  (always one plate).
- `shapes[].thumbnailSvg`: a single `<svg>` with `viewBox`, shape drawn with `fill="currentColor"`
  and **no fixed colours or size** (the page recolours it with CSS and also uses it as the editor's
  outline overlay, stretched with `preserveAspectRatio="none"` to the frame — so the outline must
  fill its viewBox edge to edge). The page injects it with `innerHTML`: it must be trusted, static
  SVG (no `<script>`, no event attributes, no external references).
- `expert` must be JSON-serialisable (the Studio prints it).
- **MUST** publish the real **ids** of shapes, patterns, pattern styles and warning **codes** early
  (a list in the package README or a `const` export). The site translates labels by id
  (`src/i18n/{bg,en}/bookmarks.json` → `labels`, `warnings`), falling back to the engine's English
  `label`/`message`. An id that changes later silently loses its translation.

### 1.5 MUST — names, confirmed readings

- one bookmark: `names = ['Name']` (length 1), none: `[]`;
- `split = N`: `names` has exactly N entries (`''` = unnamed) or is `[]`;
- `pictures`: as in 1.1; a pattern/picture set "one design, several names": one bookmark per name.
- Names are Bulgarian and English text (Cyrillic + Latin, `nameMaxLength`); the bundled font must
  cover both (the draft lists "a Cyrillic font" as still to do). The page trims names and never sends
  more than `nameMaxLength` characters.

### 1.6 MUST — the order file fits `orderMaxBytes`, always

`createOrder` returns `{ id, fileName, file, bytes, summary }`. The email carries a **single
attachment of at most 1 MB**.

- The embedded colour maps must be **budgeted by the engine**: with four different pictures the whole
  file still has to fit. Shrink map resolution / use palette-indexed PNG so `bytes ≤ limits.orderMaxBytes`
  instead of returning a file that is too large (the page refuses to send above the limit and the visitor
  is stuck).
- `container: 'json' | 'zip'`: keep both. Whether Web3Forms' free plan accepts `.json` is still being
  tested (see `BOOKMARKS-PLAN.md`); the page switches with one constant.
- `summary` is plain text for the email body: what was ordered (mode, shape, size, colours, names,
  hole, quantity), contact details, order id. **OPEN — language:** the shop reads it, so Bulgarian
  is suggested (the customer's `locale` is passed in `customer.locale`, but the recipient is always
  the shop). Whatever you pick, the same input gives the same text.

### 1.7 MUST — `readOrder(file)` returns a request the engine accepts back

Orders embed only the 4-colour maps, not the original photos. `readOrder(file).request` must be
usable **unchanged** with `preview()` (the Studio redraws it) and `print.build()` and give the same
result the customer saw. How the maps travel inside the `BookmarkRequest` is up to you (the site
never looks inside); `request.pictures`/`framing` may be stand-ins for the maps. Also: a file from an
older/newer `formatVersion` should throw an error with a stable `code` (see 2.4), not a generic one.

### 1.8 SHOULD — `print.build` progress

`build(req, { nozzle, onProgress?: (fraction: number) => void })`. A print build can take seconds;
with a fraction the Studio can show a progress bar instead of just waiting.

### 1.9 MUST — a custom size, beyond the two presets

Besides the presets (`40x160`, `50x160`) the visitor can type **any width and height in mm** within
limits the engine states. Additive; `size` stays a string.

```ts
interface Range { min: number; max: number; step: number }      // mm
interface EngineOptions {
  sizes: { id: string; label: string; widthMm: number; heightMm: number }[];   // presets, as before
  customSize?: { widthMm: Range; heightMm: Range };             // NEW — absent = presets only
}
// BookmarkRequest.size: a preset id ('40x160') OR any 'WxH' in mm, e.g. '45x150', '52.5x170'
```

- **`size` grammar:** `"<width>x<height>"`, millimetres, decimal point (never comma), lowercase `x`.
  Your `parseSize` already accepts this, so the order file, `readOrder` and `make --order` need no
  new field; presets are simply common values of the same grammar.
- **Out of range → reject** with the error code `SIZE_OUT_OF_RANGE` (the page validates against
  `options().customSize` first, so a visitor never sees it; it protects hand-made requests and
  orders). Don't silently clamp: what is ordered must be what is printed.
- **Every one of the 10 shapes must be correct at every size in the range**, not just at the presets:
  outline, hanging hole, name placement/fit, picture crop (`framing` works in fractions of the
  frame, so it needs no change), pattern scale. Decide what scales with the size (corner radii,
  arch height) and what stays in mm (hole diameter, wall and bridge thickness, the smallest
  feature the nozzle can print) — the result must stay printable with both nozzles.
- **Warnings, not failures,** for combinations that print but disappoint: the name doesn't fit,
  a very thin or very short bookmark, a hole that leaves too little material. Stable `code`s, see 2.2.
- **OPEN — the ranges** (yours to set, from what prints well): the page just shows
  `min`–`max` from `options()`. Constraints from the site's facts (`business.json`): nothing larger
  than **250 mm on any side** (one-piece limit 25 × 25 × 25 cm). **A set is printed on one plate
  (256 mm) and holds at most 4 bookmarks** (`set.max`), so the ranges must keep a full set of the
  chosen size on one plate: side by side that is `4 × width + 3 gaps ≤ 256`, about 60 mm a bookmark.
  Either cap `widthMm.max` there, or answer an over-wide *set* with a warning/error you define
  (`options()` can't express "max width depends on the count", so say which in your reply).
  Suggested `step: 1` (whole millimetres).
- The preview PNG keeps the **true proportions** of the chosen size (the page sizes its frame from
  the numbers in the request), and `createOrder`'s `summary` states the size in mm.

## 2. Behaviour the page depends on

### 2.1 MUST — preview is fast, repeatable and cheap to repeat

`preview` is called on **every** change (name keystroke, colour drag, picture drag), debounced 250 ms,
always with the **same picture Blobs**. If every call re-decodes and re-quantises a 10 MB photo the page
stutters. So:

- Decode + analyse a picture **once per picture** inside the worker (cache by content hash, or offer
  a handle such as `engine.loadPicture(blob) → id` — your choice; if you choose handles, tell the site
  and it will adopt them). A name edit must cost milliseconds, not a re-quantisation.
- **Bound memory when decoding**: a 10 MB phone photo is ~48 megapixels (~190 MB RGBA). Decode in the
  browser through `createImageBitmap(blob, { imageOrientation: 'from-image', resizeWidth / resizeHeight })`
  (EXIF handled, size capped around 2000 px on the long side). Please check that the decoding path
  does not depend on Node's `Buffer` (`jpeg-js` uses `Buffer` unless asked not to; browsers don't have it).
- The page discards stale answers itself; if you can, accept `preview(req, { signal })` and stop early.
- Target (a guide, not a contract): shape/pattern/colour/name change with the picture already
  analysed **< 300 ms** on a mid-range laptop; first picture **< 2 s**.

### 2.2 MUST — what `preview().png` is

- A real **PNG** (`Blob`, `type: 'image/png'`) — the site shows it as a `data:` URL (its CSP allows
  `data:` images, not `blob:`), so keep it modest: **≤ ~300 KB**, around **900 px on the long side**.
- The whole set (every bookmark) in **one image**, side by side with a small gap, in the order of
  `pictures`/`names`/split slices.
- **Transparent background**, nothing baked in around the shape: the site draws the surface (light and
  dark themes) and the card. No drop shadow, no label text.
- It must look like the printed result (4-colour reduction, cut-through, relief, name, hole), not a
  sketch; the page promises "what you see is what we print".
- `warnings`: stable `code`s (e.g. a name too long for the shape, a hole overlapping the name, a thin
  detail that won't print). The page shows `bookmarks.warnings.<code>` and falls back to `message`.

### 2.3 MUST — worker and the site's CSP

The site's CSP (`src/index.html`): `default-src 'self'`; `script-src 'self' 'unsafe-inline' 'unsafe-eval'`;
`img-src 'self' data: https:`; `connect-src 'self' …`; **no `blob:` anywhere**. Consequences:

- The worker must be a **same-origin file**, never a `blob:` / `data:` URL created at runtime.
- **Do not rely on the bundler finding the worker.** The site builds with Angular's esbuild
  application builder: `new Worker(new URL('./worker.js', import.meta.url))` is only bundled when it
  appears in the site's *own* sources, not inside `node_modules`. So make all three work:
  1. `createBookmarkEngine({ worker?: Worker, assetsBaseUrl?: string })` — if `worker` is given the
     engine talks to it; if not it tries `new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })`
     (fine for Vite and the playground).
  2. `@printkit/bookmark-creator/worker` exports a **function** (`serveBookmarkEngine()`), it must not
     do anything just by being imported. The site will have a 2-line file in its own sources —
     `bookmark-engine.worker.ts`: `import { serveBookmarkEngine } from '@printkit/bookmark-creator/worker'; serveBookmarkEngine();`
     — and create it with `new Worker(new URL('./bookmark-engine.worker', import.meta.url), { type: 'module' })`.
     (If the entry self-runs, `"sideEffects": false` in your `package.json` lets bundlers delete the
     bare import. A function export avoids the trap.)
  3. The worker's messages use structured clone only (`Blob`, plain objects, `Uint8Array`): no
     functions, no class instances, no `Error` subclasses that lose their `code` (see 2.4).
- **Non-JS files are fetched by URL, never found by magic.** Fonts (and, for `/print`, the manifold
  `.wasm`) must load from a base URL the host gives you: `assetsBaseUrl` for the engine (fonts), and
  `createBookmarkPrint({ wasmUrl?, assetsBaseUrl? })` for `/print`. The site copies them into its own
  output (`/assets/bookmarks/…`, an `angular.json` assets glob over `node_modules/@printkit/bookmark-creator/fonts`),
  so they are same-origin, cacheable and covered by `connect-src 'self'`. Nothing may use `fs`,
  `import.meta.resolve` or a CDN. WebAssembly compiles under the existing `'unsafe-eval'`.
- **Only the fonts the request needs** are fetched (lazily); a bookmark without a name loads no font.

### 2.4 SHOULD — errors have codes

`preview`, `suggestColours`, `createOrder`, `readOrder` and `build` reject with an object that has a
stable string `code` (survives the worker boundary: e.g. `{ code: 'PICTURE_UNREADABLE', message }`).
Suggested: `PICTURE_UNREADABLE`, `PICTURE_TOO_LARGE`, `SIZE_OUT_OF_RANGE`, `ORDER_TOO_LARGE`, `ORDER_UNSUPPORTED_VERSION`,
`ORDER_CORRUPT`, `ENGINE_FAILED`. Today the page shows one generic message for any failure; with
codes the site will add a translated message per code (`message` is the fallback).

### 2.5 MUST — privacy

- **No network requests of its own** apart from fetching its own assets (fonts, wasm) from
  `assetsBaseUrl`/`wasmUrl`. No telemetry, no fonts from a CDN.
- **No browser storage**: nothing in `localStorage`, `sessionStorage`, IndexedDB or the Cache API
  (the site has unit and e2e tests that fail if a picture lands there; keep any worker cache in memory).

### 2.6 SHOULD — size and determinism

- The customer entry (`.` + worker + a font) is loaded only on the bookmarks page; report its
  **gzip size** when you publish. Guide: ≤ 400 KB gzipped without fonts. `/print` (wasm) is never
  loaded for customers.
- Same request ⇒ same preview and same order file bytes (seeded; no `Date.now()` in the picture path),
  except the order's `id` / `createdAt`.

## 3. Delivering it for local testing (before npm publish): a local `.tgz`

Decided 2026-10-30: **no symlink.** The site installs a tarball made by `npm pack`, because that is
exactly what the registry will deliver — it catches what a symlink hides (a file missing from
`files`, a wrong `exports` entry, a dependency that is only in your workspace root, a `.d.ts` the
site's TypeScript can't read). Only when it all works here does `npm publish` happen.

Since there is no live link, every change is *pack → reinstall → check*. So:

1. **One command makes a trial build.** Add a script (name it `pack:site`) that bumps the version
   (`npm version prerelease --preid=local --no-git-tag-version` → `0.1.0-local.N`), builds, runs
   `npm pack` into a fixed folder and **prints the absolute path of the `.tgz`**. A new version
   every time, so npm never reuses a cached tarball; the lockfile never sees it (the site installs
   with `--no-save`). Keep your own playground (`apps/playground`) as the fast loop for engine-only
   work; the site is for integration checks.
2. **`"prepack": "npm run build"`**, so a tarball can never contain a stale `dist`.
3. **The tarball must be complete and clean.** `files` already lists `dist` and `fonts`; add the
   README, the order JSON Schema and any `.wasm`/font file outside those folders. Check with
   `npm pack --dry-run`: nothing from `test/`, `node_modules`, `output*/` or `projects/`.
   (`"private": true` blocks `npm publish` only, not `npm pack` or installing the tarball;
   remove it for the real publish.)
4. **Declare every runtime import in `dependencies`** with real published versions: the site installs
   the `.tgz` into its own tree, so anything that only resolves from your workspace root fails there.
   The `.d.ts` files must compile with the site's TypeScript and `lib: ["dom"]` (`Blob`, `Worker`);
   every `exports` entry (`.`, `./print`, `./worker`) needs `types` + `import`.
5. **Node-only code stays out of `.`, `./worker` and `./print`**: no `node:*` imports, `Buffer`,
   `process`, `fs`. (`./node` and the CLI may use them.) The site's browser build fails on the first one.
6. **Tell the site**, after each trial build: the absolute path of the `.tgz`, its version, anything
   that differs from this document, and the export names once they exist (`createBookmarkEngine`,
   `serveBookmarkEngine`, `createBookmarkPrint` or `build`).

## 4. What the site does with it (so you can check your side)

1. `npm install --no-save "<path>.tgz"` — `--no-save` keeps `package.json` and the lockfile clean
   until the real publish (a later `npm ci` removes it again; the site re-runs the command).
2. Points `BOOKMARK_ENGINE` / `BOOKMARK_PRINT` in `engine.token.ts` at the package, replaces the
   draft types with the package's, replaces the stub ids in `bookmarks.json` with the real ones.
3. Adds the 2-line worker file and the fonts asset glob.
4. Runs: unit tests, a production build, the e2e flow (upload → preview → order file), the CSP check
   (no `blob:` violation in the console), Lighthouse on the page and — from the admin — one real print build.
5. Sends a real order and opens it with `readOrder` and `make --order`.
6. After `npm publish`: installs `@printkit/bookmark-creator@<version>` from the registry (saved this
   time), repeats the checks, and only then commits.

It will report any mismatch with the published types as a diff of `engine.types.ts` against your
`index.d.ts`, so a renamed field is found by the compiler, not at runtime.
