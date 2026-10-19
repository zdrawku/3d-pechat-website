# Translations (`src/i18n/`)

The site is available in **Bulgarian** (the default, at `/…`) and **English**
(at `/en/…`). The main pages exist in every language; the **blog stays
Bulgarian-only**. Plan, decisions and next steps: [`LOCALIZATION-PLAN.md`](../../LOCALIZATION-PLAN.md).

| What | Where |
|------|-------|
| Languages and the pages that exist in each | [`locales.json`](locales.json) — the single source, also read by the sitemap, llms.txt and live-check scripts |
| UI strings, Bulgarian (source) | `bg/*.json`, one file per page plus the shared ones |
| UI strings, English | `en/*.json`, same files, same keys |
| English copy of data (catalogue, FAQ, gallery and video alt text) | `en/content/products.json` (keyed by product `linkId`), `en/content/faq.json` (question + answer keyed by FAQ `id`; order and icons come from `src/data/faq.json`), `en/content/gallery.json` (gallery alt text keyed by image `src`), `en/content/videos.json` (keyed by video `slug`) |
| Runtime: service, `t` / `localizePath` pipes, routes, guard | [`src/app/i18n/`](../app/i18n/) |
| Switcher (navbar, approved design „A“) | [`src/app/shared/language-switcher/`](../app/shared/language-switcher/) |

## How it works (one paragraph)

The language comes from the URL. `provideI18n()` activates it before the first
render, and `localeGuard` activates it on every navigation into another
language, so the prerendered HTML and the hydrating browser always agree.
Templates read strings with the typed `t` pipe —
`{{ 'home.hero.title' | t }}`, with placeholders
`{{ 'contact.info.response' | t: { hours: replyHours } }}` — and build links with
`[routerLink]="'/contact' | localizePath"` (→ `/en/contact/` on English pages).
Keys are type-checked: a misspelled key is a build error. `SeoService` emits
`<html lang>`, `og:locale`, the canonical and the `hreflang` set for every page
in `localizedPages`; blog pages get none.

Bulgarian's shared strings (`common`, `shell`, `seo`, `faq`, `reviews`, `misc`)
are in the main bundle; each page's own file is imported by that page and
registered with `I18nService.registerPage()`, so its text loads with the page.
English is one lazy chunk, fetched only on English pages.

## Changing text

- **Bulgarian copy:** edit `bg/<file>.json`. Then update the same key in
  `en/<file>.json` (and every other language) — a stale translation is not
  caught by a test.
- **A new string:** add the key to `bg/…` and to every other language (the
  build fails on a missing key), then use it with `| t`.
- **Never hard-code** user-facing text in a localized page's template or code,
  and never type a business number into a translation: pass it as a
  `{placeholder}` from `src/data/business.json` (CLAUDE.md Rule 5). The spec
  rejects euro amounts and hour counts typed into any translation.
- **A product:** also add its English copy to `en/content/products.json` under
  its `linkId` (`/add-product` drafts it with the Bulgarian). A product added
  from the phone arrives without it: `/en/products/` then shows its Bulgarian
  copy marked `lang="bg"`, and `i18n.spec.ts` lists it as pending.
- **The FAQ:** change `src/data/faq.json` and `en/content/faq.json` together
  (the English copy is keyed by the same `id`; numbers only from `business.json`).
- **A gallery image** (a gallery `manifest.json`, see `GALLERY_MANIFESTS.md`):
  add its English alt text to `en/content/gallery.json` under its `src` as
  `carousel-images.ts` lists it. Until then the English page shows the
  Bulgarian alt marked `lang="bg"`, and `i18n.spec.ts` lists it as pending.

## Adding a language (e.g. German)

1. `locales.json`: add `{ "code": "de", "label": "Deutsch", "englishName": "German", "ogLocale": "de_DE", "intl": "de-DE" }`.
2. `src/app/i18n/locales.ts`: add the loader `de: () => import('../../i18n/de').then((m) => m.default)`.
3. Copy `en/` to `de/` and translate every JSON file (`satisfies LocaleBundle`
   in `de/index.ts` makes a missing key a build error). Translate *meaning*,
   not words: page titles and descriptions are SEO copy for that market.
4. `src/i18n/i18n.spec.ts`: add the bundle to `BUNDLES`.
5. `scripts/generate-sitemap.js`: add a `MAIN_PAGE_LASTMOD` entry for each
   `/de/…` page (the generator exits until you do); `scripts/generate-llms.js`:
   add the `LANGUAGE_PAGES` entry.
6. `npm run build` and `npm test -- --watch=false --browsers=ChromeHeadless`.

Routes, the switcher, the footer links, hreflang, the sitemap alternates and
the live check pick the new language up from `locales.json` by themselves.

## Rules the specs enforce

- Same keys and the same `{placeholders}` as Bulgarian, no empty strings
  (`i18n.spec.ts`).
- No euro amounts or hour counts typed by hand; nothing from
  `business.json` `neverClaim` (SLA/SLS, scanning, same-day, invoices).
- English FAQ: every id translated (and no others), only numbers that
  `business.json` states.
- Catalogue: no copy for products that don't exist; same structure
  (personalisation list, read-more, links); untranslated products reported as
  pending. Gallery: alt text only for images that exist; untranslated images
  reported as pending.
- Routes: every localized page under each language, the blog Bulgarian-only
  (`app.routes.spec.ts`); sitemap hreflang pairs (`scripts/generate-sitemap.test.js`).
