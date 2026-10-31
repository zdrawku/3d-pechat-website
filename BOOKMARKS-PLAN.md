# Bookmark creator — plan and status

> Started 2026-10-29. Page: `/products/bookmarks/` (Bulgarian) and
> `/en/products/bookmarks/`, in the Products menu group. Design artifact (variants
> and the approved choice): [🔖 Bookmark Creator Designs](https://claude.ai/artifact/2CVHvcG1Vf3LigxkjpAkxP)
> — **menu A (expandable group, expanded by default, same 4 px gaps) + page A (tabs
> and a sticky live preview)**, approved by Zdravko 2026-10-29.

The site holds **no bookmark logic**. The engine package `@printkit/bookmark-creator`
(written in its own repo) does colours, previews, shapes, patterns, name placement
and the order file; the site collects the choices, shows what the engine returns and
sends the order.

## Status

| Phase | What | State |
|---|---|---|
| **W1** | Menu group, page with the three modes, order form, localisation, tests — all on a **stub** engine | ✅ built 2026-10-29, uncommitted |
| **W1 open item** | **Real Web3Forms test: does a `.json` attachment arrive on the free plan?** | ⬜ **not verified** — see below |
| **W2** | Wire the real engine: first from a local `.tgz` (`npm pack`, no symlink), then from npm — see "W2" below | 🟡 wired 2026-10-30 on rc.2; switched 2026-10-31 to `@printkit/bookmark-creator@^0.1.0` from npm (saved in `package.json`), uncommitted; the page does not offer every engine option yet (see "Engine options the page does not offer yet") |

## What W1 contains

- **Routes:** `products/bookmarks` is one of the localized pages (`src/i18n/locales.json`
  `localizedPages`, `app.routes.ts`, `pagePath('bookmarks')`), so hreflang, the sitemap
  (`MAIN_PAGE_LASTMOD`, `PAGE_SETTINGS`) and `llms.txt` pick it up. `/products/` has a
  card linking to it (a real photo of our bookmarks) and its lastmod was bumped.
- **Menu:** the drawer's Products chip is a group — the chip (→ all products), a caret
  that collapses it, and two sub-chips. Starts expanded, opens again when a products
  page is visited. A „Разделители за книги“ link is also in the footer.
- **Page** (`src/app/bookmarks/`): `igx-tabs` for the three modes (header-only — see
  the note on clicks below), one set of controls shared by all of them in the same
  order (picture or pattern → shape → size → colours → name → name position → hole),
  a sticky preview with the Order button (a bar at the bottom on phones). Mode 3 is a
  toggle of three kinds: one picture split across the set, **different pictures** (one
  per bookmark, up to the engine's limit, all shown in the preview), or one design with
  several names. The name is optional: a four-way choice „Без / Горе / В средата / Долу“
  (several names have no „Без“). A picture is positioned by dragging it inside the
  shape (`src/app/bookmarks/framer/`; wheel or +/− zoom, arrow keys from the keyboard).
- **Engine boundary** (`src/app/bookmarks/engine/`): `engine.types.ts` is the contract
  (section 8 of the handoff, plus the additions in [`BOOKMARKS-ENGINE-CONTRACT.md`](BOOKMARKS-ENGINE-CONTRACT.md)), `stub-engine.ts` the
  temporary stand-in (fixed options, four fixed colours, a tiny order file, and a
  **demo preview**: a flat SVG sketch of the request — size, shape outline, pictures where
  they were dragged to, name, hole — so the page's wiring is visible; it is not how a
  bookmark looks), and `engine.token.ts` the injection tokens. The engine starts only in the browser after the first render
  (the route prerenders a shell); every list comes from `options()`.
- **Order form:** the contact form's fields and hCaptcha plus quantity and notes. The
  email body is the engine's `summary`; the only attachment is its order file, sent
  only if it is within `limits.orderMaxBytes`. `generate_lead` fires with the new
  `bookmark_order` lead source.
- **Pictures stay in memory** — no upload, no web storage (a unit and an e2e test
  guard it). The preview comes back as a Blob and is shown as a `data:` URL, because
  the site's CSP allows `data:` images but not `blob:` ones.
- **Colour picker:** `igc-color-picker` (Ignite UI Web Components), the one exception
  to „always Ignite UI for Angular“ (recorded in `CLAUDE.md`). No global theme CSS —
  see the note there.
- **Theme:** `igx-tabs` and `igx-button-group` were removed from `$exclude-components`
  in `styles.scss` (their CSS is now in the global stylesheet); the page colours them
  through their theme variables only.

### Notes worth knowing

- **Ignite's `igx-tab-header` only selects on click when its tab has a content panel.**
  Ours are header-only, so the page handles the click itself (keyboard works as is).
- **`<noscript>` must not be used in a hydrated template** — browsers parse its
  content as text, which breaks hydration (NG0500).
- **Lead time text** comes from `business.json` (`leadTimeWorkingDays.largeOrSeries`,
  „3–7 работни дни“), as Rule 5 requires, not from a typed number.

## ⚠ Web3Forms attachment — not verified yet

The handoff says the free plan delivers one attachment of up to 1 MB. The contact
form's code (and `FEATURE-IDEAS-PLAN.md`) say the opposite: file upload is a **Pro**
feature, which is why the contact form's attachment is commented out. Only a real
test settles it.

**Why it was not run from the agent's session:** Web3Forms sits behind a Cloudflare
challenge — a plain request from Node gets `403 Just a moment…`, and a headless
browser's request fails the same way (no email was sent). The form also needs a
solved hCaptcha. It has to be done by hand in a real browser:

1. `npx ng serve`, open <http://localhost:4200/products/bookmarks/> and choose the
   **Шарка** tab (a pattern needs no picture).
2. **Поръчай** → fill in the form with your own email in „Бележки“ for easy finding →
   solve the captcha → **Изпрати поръчката**.
3. Open `3dpechat.bg@gmail.com`: the mail „Поръчка на разделител stub-order“ should
   carry **`bookmark-order-stub-order.json`** (a few dozen bytes) and the stub's summary.
4. Record the result here:

| Date | Attachment | Result |
|---|---|---|
| | `.json` | ⬜ arrived / ⬜ mail without the file / ⬜ refused (note Web3Forms' message — it is logged to the console as „Web3Forms refused the bookmark order“) |
| | `.zip` (set `ORDER_CONTAINER = 'zip'` in `bookmark-order-form.component.ts`) | ⬜ |

If **neither** arrives, the free plan cannot carry the order and the options are the
Pro plan, or sending the order file another way (for example inline in the message
body — a ≤ 1 MB file is too large for that without compressing it, so decide with the
engine author). Do not go live with the order form before this is settled: **a
success answer from Web3Forms does not prove the file arrived.**

## Contract with the engine package

Zdravko writes the package himself, in the engine repo with another agent. Everything the
page needs beyond `WEBSITE_HANDOFF.md` section 8 — a set of **different pictures**
(`pictures`), **hand positioning** (`framing`), colours per picture, real ids and warning
codes, the worker under the site's CSP (no `blob:`), preview and order-file requirements,
and how to deliver a local build — is written for that agent in
[`BOOKMARKS-ENGINE-CONTRACT.md`](BOOKMARKS-ENGINE-CONTRACT.md). That file is the one source;
the site's mirror of it is `src/app/bookmarks/engine/engine.types.ts`.

Decided 2026-10-30: **sets of up to 4** (`set.max` = 4, one plate holds at most 4; the stub says so too), a **custom
size** (any width × height in mm within the engine's `customSize` ranges, on top of the two
presets), and delivery as a **local `.tgz`** (no symlink). Still open there (a decision for
the package author): the custom-size ranges, the language of the order `summary`, and whether
`pictureColours` (a palette per picture) is built now or later.

> **Custom size — site side not built yet.** The engine's part is in the contract (§1.9). The
> page's control for it is a user-facing change, so it waits for an approved design (Rule 2 in
> `CLAUDE.md`). `size` stays a string (`'WxH'` in mm), so `engine.types.ts` needs only
> `EngineOptions.customSize`.

## Privacy policy — proposed wording (not applied)

The policy already covers files and pictures you send us, but it does not mention the
bookmark creator's picture that never leaves the browser. Suggested addition to
„Какви данни получаваме“ (`src/legal/bg/privacy.md`, and the English twin):

> **Когато поръчвате разделител за книги:** снимката ви се обработва във вашия браузър
> и не се качва никъде. С поръчката получаваме само файл с настройките и опростена
> версия на снимката с няколко цвята, заедно с името, имейла и телефона ви.
> Изтриваме ги в същия срок като останалите данни за поръчка.
>
> **When you order a bookmark:** your picture is processed in your browser and is not
> uploaded anywhere. The order sends us only a file with your settings and a
> simplified few-colour version of the picture, together with your name, email and
> phone. We delete it within the same period as other order data.

Needs Zdravko's read before it goes into the policy (and `dateModified` / the sitemap
lastmod for `/privacy/` and `/en/privacy/` bumped with it).

## W2 — wiring the real package

### Trying it before it is published: a local `.tgz`

Zdravko hands over a tarball made by `npm pack` (no symlink) and publishes to npm only when it
all works here. A tarball is exactly what the registry will deliver, so it catches what a
symlink would hide: files missing from `files`, a wrong `exports` entry, a dependency that is
not declared, a `.d.ts` this repo's TypeScript can't read. His side (a `pack:site` script that
bumps the version, builds, packs and prints the path) is in the contract, §3.

1. **Install:** `npm install --no-save "<path>.tgz"`. Every trial build has a new version
   (`0.1.0-local.N`), so npm never serves a cached one.
2. **`--no-save` on purpose.** `package.json` and the lockfile stay as committed; a later
   `npm ci` / `npm install` removes the package, so run the command again. **Never commit a
   `file:` dependency** — CI's `npm ci` would fail on a path that only exists on this machine.
3. **The switch** (when told a tarball is ready): `engine.token.ts` factories import the
   package; the draft types in `engine.types.ts` are replaced by the package's; stub ids in
   `bookmarks.json` (bg + en) become the real ones; a 2-line `bookmark-engine.worker.ts` in
   `src/app/bookmarks/` serves the worker from this repo's own sources (Angular's builder
   does not bundle a worker that lives in `node_modules`); an `angular.json` assets glob copies
   the Studio's `manifold.wasm` from the package's `dist/print/vendor/` to `assets/bookmarks/`
   (fonts need nothing: the package embeds them as lazy JS chunks);
   the stub moves to `engine/testing/` as the unit tests' fake (the real engine needs a worker
   and isn't deterministic enough for Karma — e2e runs the real one).
4. **Checks** with the tarball installed: unit tests, `npm run build`, the e2e flow (upload →
   preview → order file), a console free of CSP violations (no `blob:`), Lighthouse on the page
   (the engine must be a lazy chunk; other pages unchanged), one real print build from the
   Studio, then an order read back with `readOrder` and
   `npx @printkit/bookmark-creator make --order <file>`.
5. **After the publish:** `npm install @printkit/bookmark-creator@<version>` (this time saved),
   repeat the checks against the registry build, commit. Done 2026-10-31 with `^0.1.0`: build,
   430 unit tests, 273 e2e, the browser run on the real engine (bg + en, light/dark, 390 px),
   a Studio print build and `make --order` on site-made orders (json + zip) all pass.

### Checklist

Done 2026-10-30 on rc.2: 1, 4 (errors and warnings, bg + en), 5 (worker under the CSP, no
WebAssembly or POST on the customer page; Lighthouse not run yet), 6 (light, dark, 390 px),
and the Studio part of the checks (order zip opened, redrawn, 3MF + STLs built in the browser;
`connect-src` now allows `raw.githubusercontent.com` for the Bambu profiles). The engine is
the source of truth: the site adapts to its ids, limits (`nameMaxLength` 8) and colour roles.

Still open from the trial:
- **Colours turned all black once** (`#000000` in every picker, `NAME_NO_CONTRAST` warnings):
  seen in one browser run right after the server started, not reproduced in 9 more (nor with
  the Web Components chunk delayed). Cause unknown; watch for it.
- **A name on a cut-through pattern** is refused by the engine (`names.patternNeedsBack`); the
  page now says so and points to „С релеф“. Offering `pattern.back` instead (one more colour
  picker) is a user-facing change that needs a design first.
- Lighthouse, run 2026-10-31 locally (http-server, no compression, so only relative numbers
  mean anything): accessibility / best practices / SEO 100 on `/products/bookmarks/` and the
  English page; the page weighs ~4.9 MB against ~2.3 MB for the home page (the engine's worker
  starts there, no WebAssembly). CLS 0.60 on the Bulgarian page vs 0.07 on the English one —
  look into it. CI's Lighthouse workflow on the PR is the real comparison.

### Engine options the page does not offer yet

The engine's `BookmarkRequest` / `options()` has more than the page sends (it sends mode,
picture(s) + framing, pattern id + style, shape, preset size, colours, hole, names, place,
split). Not offered yet — user-facing, so each needs a design first (Rule 2). Design
variants (2026-10-31, awaiting a pick): [🔖 Bookmark Options Designs](https://claude.ai/artifact/39VUjUNmYyZfFLzojyLTYs).
- **`pattern.back`** — a solid back under a cut-through pattern (one more colour, `back` first
  in the roles), vs see-through. Also what lets a name sit on a cut-through pattern.
- **A set of different patterns** — `pattern.id` as a list, one bookmark each (1 to `set.max`).
- **Custom size** — any `WxH` within `customSize` (25–57 × 80–200 mm), besides the presets.
- **Font** — `nameFont` from `options().fonts` (20; the four without Cyrillic must be hidden or
  marked on the Bulgarian page); **letter size** — `nameSizeMm` (min per nozzle to 12 mm).
- **Thickness** — `thicknessMm`, exactly `thickness.values` (1–2 mm, default 1.6).
- **Frame width** — `border.widthMm` (0–6 mm, step 0.5, default 2).
- **Quality ↔ filament slider** — `quality` (0–1); each preview returns its stops with colour
  swaps and purge grams.
- **Studio only:** `expert` (20 keys, today shown as JSON only) and the nozzle (0.4 / 0.2) for
  `build`. `pictureColours` is not supported by the engine yet (`PICTURE_COLOURS_IGNORED`).

1. Everything in "The switch" above; delete the stub's demo preview and the draft types.
2. Send the page's new fields to the engine: `pictures`, `framing` (already sent today) and,
   if the engine offers it, per-picture colours (per-picture pickers in the pictures kind).
3. Frame a split with `options().set.splitGapMm` (`frameAspect` in the page: N × width + (N − 1) × gap;
   0 today, so nothing changes until the engine says otherwise).
4. Translate engine error codes (`bookmarks.errors.<code>`), warnings already are.
5. Check the worker loads under the CSP, and that customer pages stay free of WebAssembly and
   print code (Lighthouse budgets, `LIGHTHOUSE-IMPROVEMENT-PLAN.md`).
6. Check the real preview on the light and the dark surface (transparent background) and in the
   editor's outline overlay (`thumbnailSvg` stretched to the frame).
7. Send a real order end to end (this also settles the Web3Forms attachment question above).
8. Add a structured-data decision (a `Product` page needs a real price, which the site does not
   state — see `business.json` `neverClaim`).
