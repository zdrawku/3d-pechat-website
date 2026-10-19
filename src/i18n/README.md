# Translations (`src/i18n/`)

The site is available in **Bulgarian** (the default, at `/…`) and **English**
(at `/en/…`). The main pages and the blog index exist in every language; a
**blog post** exists in English only when it has been translated (8 of 16
today, at `/en/blog/<english-slug>/`). Plan, decisions and next steps:
[`LOCALIZATION-PLAN.md`](../../LOCALIZATION-PLAN.md).

| What | Where |
|------|-------|
| Languages, the pages that exist in each, the translated posts and their slugs | [`locales.json`](locales.json) — the single source, also read by the sitemap, llms.txt and live-check scripts |
| A translated post's copy and dates / its text | `en/content/blog.json` (keyed by the Bulgarian slug) / `src/assets/blogs/en/<english-slug>.md` |
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
in `localizedPages`; a blog post gets hreflang only between its real versions
(none when it exists only in Bulgarian).

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

## Translating a blog post

Each translation is its own page with its own slug, paired with the Bulgarian
post by hreflang (approved design „B“: the English blog lists only English
posts plus one card pointing to the rest; every translated post has a „Read in
Bulgarian“ / „Прочетете на английски“ link beside „Back“).

**The quick way:** `npm run translate-post -- <bulgarian-slug>` drafts the
English version with Claude (needs `ANTHROPIC_API_KEY` in `.env`) and does
steps 1–3 below for you — the auto-blog pipeline does the same for every new
post, in the same PR. Then review the draft (facts, links, slug) and build.

By hand:

1. **`locales.json` → `translatedPosts.en`:** add `"<bulgarian-slug>": "<english-slug>"`.
   Pick the English slug from what people search for in English
   (`pla-vs-pla-plus-vs-pla-pro-vs-pln`), not a transliteration. Never change
   a published slug (CLAUDE.md Rule 5.5).
2. **`en/content/blog.json`:** add the post under its Bulgarian slug: `title`,
   optional `seoTitle` (when `title | 3dpechat.bg` runs past ~60 characters),
   `description` (≤ 160 characters, no typed prices or hours), `tags`,
   `keywords`, and `date` / `dateModified` = the day the translation is
   published (bump `dateModified` by hand on a substantive edit).
3. **`src/assets/blogs/en/<english-slug>.md`:** the text. Its first line is
   `# <title>`, exactly as in `blog.json`. Keep image paths; translate alt
   text. Link only to English pages (`/en/contact/`, `/en/blog/<slug>/`); a
   link to a Bulgarian-only post is dropped or replaced. Keep the markers:
   `<!-- video -->`, `<!-- makerworld -->…<!-- /makerworld -->`, and wrap the
   FAQ in `<!-- faq -->…<!-- /faq -->` — its `### question` + answer text
   becomes the FAQPage schema word for word. Claims only from
   `src/data/business.json` facts.
4. Nothing else: one component ([`src/app/blog/article/`](../app/blog/article/))
   serves every post in every language, and its extras (player, CTA buttons,
   MakerWorld link) in `ARTICLE_EXTRAS` apply to all of a post's languages.
5. `npm run build` — the page, sitemap entry (with hreflang), llms.txt line
   and the Bulgarian post's language link appear by themselves. IndexNow
   pings the new URL after deploy.

The Bulgarian original needs no edit: its page shows the language link
(`<app-article-toolbar>`) once a translation exists. `i18n.spec.ts` fails if
the copy, the text and `locales.json` disagree.

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
6. Blog posts, if any: `translatedPosts.de` in `locales.json`,
   `de/content/blog.json`, `src/assets/blogs/de/` (see above).
7. `npm run build` and `npm test -- --watch=false --browsers=ChromeHeadless`.

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
- Blog: a translation only for a post that exists, a unique kebab-case slug,
  copy and text for exactly the posts in `translatedPosts`, the text opening
  with the copy's title, a ≤ 160-character description, real dates, nothing
  typed or from `neverClaim` in the copy (`i18n.spec.ts`).
- Routes: every localized page under each language, the Bulgarian blog with
  every registry post, each language's blog with its translations
  (`app.routes.spec.ts`); sitemap hreflang pairs, posts included
  (`scripts/generate-sitemap.test.js`).
