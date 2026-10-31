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
| **W1 open item** | **Real Web3Forms test: does a `.json` attachment arrive on the free plan?** | ❌ attachments refused (Pro-only) 2026-10-31 → the order JSON now goes as text in the field `order_json`, pasted into the Studio; ⬜ a real picture order still to send — see below |
| **W2** | Wire the real engine: first from a local `.tgz` (`npm pack`, no symlink), then from npm — see "W2" below | 🟡 wired 2026-10-30 on rc.2; switched 2026-10-31 to `@printkit/bookmark-creator@^0.1.0` from npm (saved in `package.json`), uncommitted; every engine option on the page since 2026-10-31 (see "Every engine option on the page"); per-picture palettes wait for the engine |

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
  email body is the engine's `summary`; the order file's JSON goes minified in the
  field `order_json` (no attachment — see the Web3Forms section), only if it is within
  `limits.orderMaxBytes`. `generate_lead` fires with the new
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

## Web3Forms: the order travels as text, not as a file

File uploads are a Web3Forms **Pro** feature — tested 2026-10-31 by hand (Web3Forms sits
behind Cloudflare and needs a solved hCaptcha, so an agent can't run it):

| Date | Attachment | Result |
|---|---|---|
| 2026-10-31 | `.json` | ❌ refused — HTTP 400, „You are trying to use a Pro feature, Please upgrade to use file uploads.“ No mail. |
| — | `.zip` | not tried: the refusal is for file uploads as such, not for the file type |

**Decided 2026-10-31: no file.** The order form sends `engine.createOrder()`'s JSON
(`container: 'json'`), minified, in its own form field **`order_json`**; `summary` stays the
email body. Measured with the real engine (`^0.1.0`): a pattern order ≈ 0.5 KB, one picture
≈ 59 KB, four pictures ≈ 79 KB (the colour maps are base64 PNGs inside the JSON). The
engine's 1 MB `orderMaxBytes` check stays. The Studio's Orders tab has a box to paste the
`order_json` text into (a saved `.json`/`.zip` file still opens too); pasted minified JSON was
checked to round-trip through `readOrder`.

**⬜ Still to verify by hand (before going live)** — a real picture order, not a pattern:

1. `npx ng serve`, <http://localhost:4200/products/bookmarks/>, upload a photo (a set of 4
   is the worst case), **Поръчай** → fill in, captcha → **Изпрати поръчката**.
2. In `3dpechat.bg@gmail.com`: the mail arrives (Web3Forms accepts a ~80 KB field) and
   shows an `order_json` field. Gmail clips mails over ~102 KB — use „View entire message“.
3. Copy the whole `order_json` value → `/studio/` → Поръчки → paste → **Отвори поставената
   поръчка**: the preview matches what was ordered.

| Date | Order | Mail arrived | Field complete | Studio opened it |
|---|---|---|---|---|
| | | ⬜ | ⬜ | ⬜ |

If Web3Forms truncates or refuses a field that long, the fallback is Pro, or asking the
engine author for smaller colour maps.

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

### Every engine option on the page (built 2026-10-31, uncommitted)

Design: [🔖 Bookmark Options Designs](https://claude.ai/artifact/39VUjUNmYyZfFLzojyLTYs) —
Zdravko picked **1D** (every option shown, grouped by what it changes, one row per small
setting: label left, control right), **2A, 3A, 4, 5A (inside 1D), 6A, 7**. Built:
- **Pattern looks** (2A): picture tiles „Ажурна / С гръб / С релеф“ — each engine style, plus
  a style without its own back again with `pattern.back`. Colours are kept per role (back,
  pattern, frame), so switching the look keeps them; defaults are a calm sage on sand. A name
  on „Ажурна“ moves the pattern to „С гръб“ by itself, with a note (`names.patternNeedsBack`).
- **Font** (3A): `app-bookmark-font-picker`, the engine's 20 fonts in its groups, each drawn
  with the typed name. Latin-only fonts are disabled while the name has Cyrillic; `print:
  'check'` fonts are tagged „за кратки имена“. The samples use self-hosted web-font subsets of
  each font's `family` + `weight` (`scripts/fetch-bookmark-fonts.mjs` →
  `src/assets/fonts/bookmarks/`, 728 KB, fetched only when drawn; OFL licences copied from the
  package by `angular.json`). The package's own fonts are whole TTFs in JS (~7.7 MB), meant for
  printing. **Letter size**: ± stepper from „Авто“, nozzle minimum to 12 mm.
- **Size** (4): presets + „Свой размер“ (two mm fields, limits from `customSize`; outside
  them the page says so and nothing can be ordered). **Thickness** (button row of the
  engine's values), **frame** (± stepper, 0 = „Без рамка“), the hole, all in „Форма и размер“.
- **Quality** („Изработка“): the stops the preview returns, shown when there are two or more;
  the Studio also sees swaps, grams and plan.
- **Set of different patterns** (6A): a fourth kind of set, one slot per bookmark (up to
  `set.max`); the pattern list edits the active slot. Style and colours are shared.
- **Studio** (7): `app-bookmark-expert-form`, generated from `options().expert` (numbers with
  units and limits, lists as buttons); only changed values go into `request.expert`. The
  nozzle (expert) is also passed to `print.build`; the Orders tab has its own nozzle choice.

Waiting for the engine (requests in `BOOKMARKS-ENGINE-CONTRACT.md`):
- **§1.10 a palette per picture** (Zdravko wants it): 0.1.0 ignores `pictureColours`. When it
  lands, each picture in „Различни снимки“ gets its own pickers, by the plate rule the engine sets.
- **§1.11 preview depth:** „С гръб“ and „С релеф“ preview byte-identical today.
- Optional: the web-font subsets could ship in the package instead of being fetched here.

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
7. Send a real picture order end to end and open it in the Studio by pasting `order_json` (see „Web3Forms: the order travels as text“).
8. Add a structured-data decision (a `Product` page needs a real price, which the site does not
   state — see `business.json` `neverClaim`).
