# Localization plan — 3dpechat.bg in more than one language

> **Status (2026-10-18):** Bulgarian + English implemented on branch
> `localization-branch`, **uncommitted** — the owner reviews and commits.
> Language switcher design **A approved** by Zdravko the same day
> ([artifact](https://claude.ai/artifact/CXV3F2jyajD7vkb7thGBmx)). Blog
> localization (phases B2–B3 below) is **deferred** at the owner's request.
>
> Everything else was decided by the agent ("assume what's best") and is
> marked ⚑ where it needs the owner's confirmation — see
> [§6 Questions](#6-questions-for-the-owner).

How to change text or add a language: [`src/i18n/README.md`](src/i18n/README.md).
Must-follow rules: CLAUDE.md Rule 6.

---

## 1. What was asked

A localized website with a language dropdown (or another Ignite UI control
that makes sense), built so translations can be added language by language,
following Angular best practices.

## 2. Decisions and why

| # | Decision | Why (and what was rejected) |
|---|----------|-----------------------------|
| L1 | **Runtime i18n with URL-prefixed languages** (`/…` Bulgarian, `/en/…` English), prerendered per URL | `@angular/localize` (Angular's compile-time i18n, and what the abandoned `add-localization` branch used) builds the whole app once per language and copies **all assets** into each language folder — 76 MB of images per extra language on GitHub Pages — and every language must have the same routes, so the untranslated blog would be duplicated. It also serves one language per `ng serve` and breaks the single-output assumptions of the sitemap / link-check / schema / IndexNow scripts. A runtime layer keeps one build and one asset tree; with prerendering, every URL is still complete static HTML in its language, which is what SEO needs. |
| L2 | **A small in-house typed i18n layer** (`src/app/i18n/`, ~250 lines) instead of Transloco / ngx-translate | Keys are a TypeScript type derived from the Bulgarian files, so with `strictTemplates` a misspelled key **fails the build** (libraries can't do that). No new dependency to keep in step with Angular majors. Bulgarian core strings load synchronously, so SSR + hydration are deterministic and the existing unit tests (which assert Bulgarian text) kept working. Translations are plain JSON — Rule 4. |
| L3 | **Bulgarian stays at the root, unchanged**; English under `/en/` with the same slugs | No indexed URL changes (Rule 5.5). Default-language-unprefixed is the common pattern. Same slugs (`/en/prices/`) keep the mapping trivial. |
| L4 | **`/en/` is now the translated home page**; the 2026-10-17 standalone English landing (`src/app/en-page/`) was removed ⚑ | A switcher has to land on *the same page* in the other language, and every future language will translate the real home page. The URL `/en/` is unchanged. The landing's facts now live on the English prices / contact pages. Restorable with `git checkout main -- src/app/en-page`. |
| L5 | **The blog stays Bulgarian-only** for now | 16 Bulgarian articles; translating them is a content project (see §7, B2–B3). English pages label the link "Blog (in Bulgarian)" with `hreflang="bg"`; the switcher on a post goes to the English home page; posts carry no hreflang. |
| L6 | **One source for languages: `src/i18n/locales.json`** | Routes, hreflang, the switcher, footer links, sitemap alternates, llms.txt and the live check all read it (Rule 5 spirit). |
| L7 | **Translation files per page and language** (`src/i18n/<lang>/<page>.json`) + **content overlays** (`en/content/products.json` by `linkId`, `faq.json`, `videos.json`) | Small, reviewable diffs; "add a language" = copy the `en/` folder and translate. Data stays in `src/data/` (images, links, dates); overlays only carry visible copy, so a translation can't break an image or link. |
| L8 | **Switcher: design A** — globe + code pill in the navbar opening an `igx-drop-down` that lists languages by their own names, plus plain footer links ✅ | Approved. Scales to any number of languages; native names (no flags — flags are countries, not languages). The drop-down's items exist only while it's open, so the footer links give crawlers a plain `<a hreflang>` path. |
| L9 | **SEO:** each language version self-canonical; `hreflang` bg / en / **x-default → Bulgarian** on every main page, in the page head **and** the sitemap; `og:locale` per language; `<html lang>` per route | Google's recommended setup. x-default = Bulgarian because it's the primary market. |
| L10 | **No automatic redirect by browser language**, no remembered preference | Auto-redirects hide pages from crawlers (Googlebot crawls from the US with English) and annoy people who chose a language. ⚑ A dismissible "This page is available in English" hint is possible later. |
| L11 | **Google reviews are not translated** — shown in Bulgarian with `lang="bg"` and a one-line note on English pages | They are real customers' words (Rule 5 `neverClaim`: no invented reviews; a translation would put words in their mouths). |
| L12 | **Business numbers enter translations as `{placeholders}`** from `business.json` | Rule 5; the spec rejects euro amounts and hour counts typed into any translation. |
| L13 | **Bundle:** Bulgarian shared strings in the main bundle; each page's Bulgarian strings stay in its lazy chunk (`registerPage()`); English is one lazy chunk | Measured, see §4. |

## 3. What was built

**Runtime (`src/app/i18n/`)**
- `locales.ts` — the registry (from `locales.json`), loaders, URL helpers (`splitLocalePath`, `localizePath`, `languageAlternates`, `switchLocaleUrl`).
- `i18n.service.ts` — active language (signal), on-demand loading (the latest `use()` wins), `t()` / `plural()` (Intl.PluralRules), Intl number / list / month formatting, `langIfForeign()` (marks Bulgarian-only content on other languages' pages), `registerPage()`, owns `<html lang>`.
- `translate.pipe.ts` — `t` (typed keys) and `localizePath` pipes.
- `provide-i18n.ts` — app initializer (language from the URL before the first render, so prerender and hydration agree; if that language's strings don't load, the page reloads once, then stays as prerendered), `localeGuard` (switches language on navigation), and a re-sync from the URL of the page shown after every finished, cancelled or failed navigation (a newer click can cancel a navigation whose guard already switched the language).
- `localized-content.ts`, `business-copy.ts` — gallery / product / video copy overlays; address and opening hours per language.
- `app.routes.ts` — `/en/` subtree generated from `locales.json`; Bulgarian pages, blog and 404 in Bulgarian. The blog block keeps the shape the auto-blog scaffolder's regex expects.

**UI**
- `shared/language-switcher/` — approved design A (`igxButton` + `igx-drop-down` + `igxToggleAction` + `igxDropDownItemNavigation`), keyboard operable, compact under 420 px.
- Shell, home, portfolio, products (+ grid), prices (+ calculator), contact, FAQ, reviews, review snackbar, video, 404/500: all strings through `t`, links through `localizePath`, numbers from `business.json`.
- Phone navbar: under 420 px the bar padding halves (Ignite spacing token) and the controls sit 6 px apart; under 350 px the menu pill drops its „Меню“ label. Verified on screen at 320 / 360 / 390 / 420 px.
- Contact form: hCaptcha in the page's language; English enquiries arrive as "3dpechat.bg contact form (English)" ⚑.

**Content (`src/i18n/`)** — Bulgarian source files (verbatim from the templates), English translations of all UI copy, all 14 products, the 10 FAQ answers, the video alt text and the alt text of all 33 captioned gallery images (`en/content/gallery.json`, keyed by image `src`; named like the English catalogue).

**SEO / scripts** — `SeoService.applyPageSeo(page)`; hreflang derived for every localized page; sitemap with `xhtml:link` alternates (27 URLs); llms.txt gets an English section; the live check verifies that the sitemap lists every language version, `lang` + `hreflang` on every sitemap URL (in any order) and English numbers / address.

**Docs** — `src/i18n/README.md`, CLAUDE.md Rule 6, AI_INSTRUCTIONS.md, `src/data/README.md`, the `/add-product` skill (drafts English too), the phone add-product PR checklist, AI-VISIBILITY-PLAN.md Phase 5 note, FEATURE-IDEAS-PLAN.md artifact row.

## 4. Verification

| Check | Result |
|-------|--------|
| `npm run build` (lint + generators + prerender + internal-link check) | ✅ 31 static routes, all internal links canonical |
| Unit tests (`npm test -- --watch=false --browsers=ChromeHeadless`) | ✅ 254 (170 before; the old English page's 5 removed, 89 added: translation contract, routes, service, startup / guard / cancelled-navigation language, switcher, gallery alt text, English renders of every page) |
| `npm run test:scripts` | ✅ 49 (sitemap, llms.txt, locale URLs, live-check language + sitemap-completeness tests added) |
| Playwright functional suite (e2e, locally against the build) | ✅ 148 — incl. switcher click-through and keyboard, 4 phone widths, hreflang on every page in both languages, axe on English pages |
| Bulgarian pages vs `main` (text + head tags of all 27 prerendered pages) | ✅ identical except: the switcher in the navbar, the 500 page now in Bulgarian, the home H2 typo fix („Каквo“ had a Latin *o*), and hreflang on the 4 other main pages |
| lang + hreflang of every sitemap URL in the build (same check as the live check) | ✅ 27 / 27 |
| Screenshots light / dark, desktop / 320–390 px | ✅ matches artboard A |

**Bundle cost** (initial JS + CSS, estimated transfer): `main` 217.3 kB → this branch 232.9 kB (**+15.6 kB, +7%**). About 9 kB is Ignite's drop-down module, which imports the input-group package (its autocomplete needs it); ~4 kB the Bulgarian shared strings (esbuild writes Cyrillic as `\uXXXX`); the rest the i18n code. Lighthouse's performance budget is a warning; see §7 for the 9 kB fix.

## 5. Things found on the way (not changed unless noted)

- ✅ Fixed: home H2 „Каквo представлява 3D печатът?“ had a Latin *o*.
- ✅ Fixed: the products template never closed its outer `<div>`.
- ✅ Removed: a `≤360px` `.igx-navbar__right` padding rule in `app.component.scss` that never matched (Ignite's element is outside the component's encapsulated styles), and the unused `.icon_12` class.
- Not changed: „Монетите се задържат **здрав** в слотовете“ (products page) — probably „здраво“.
- Not changed: typos in the Bulgarian gallery alt text (the `manifest.json` files) — „Мехизъм“ (механизъм), „сухранение“ (съхранение), „Падъл БОрд“, „3Д“. The English alt text is keyed by image `src`, so fixing them won't break it.
- Not changed, from the 2026-10-19 review (small; the owner decides):
  - an untranslated product card puts `lang="bg"` on the whole card, its English buttons included — better on the name / description / tags only;
  - the 404 page makes no SEO call, so after in-app navigation it keeps the previous page's canonical / hreflang (it isn't prerendered or indexed);
  - the switcher's accessible name („Език: Български. Смени езика“) doesn't contain its visible „bg“ / „en“ (WCAG 2.5.3);
  - opening hours on non-consecutive days would print as a range (`['Monday', 'Wednesday', 'Friday']` → „пон.–пет.“) — latent, today it's every day;
  - llms.txt's Bulgarian page list and the e2e `ENGLISH_ROUTES` are hand-written, not derived from `locales.json`;
  - the switcher drops a `?query`; `/en/prices//` lands on the 404.
- `app.component.scss` is 381 bytes over its 12 kB *warning* budget (the switcher's phone rules); `main-page.component.scss` was already over.

## 6. Questions for the owner

1. ⚑ **`/en/` = translated home page** (old English landing removed). Keep, or restore the landing as the English home?
2. ⚑ **English copy** is the agent's translation (British spelling, like the 2026-10-17 page; `og:locale` stays `en_US`). Please read at least the page titles / descriptions (`src/i18n/en/seo.json`), the home hero and the FAQ.
3. ⚑ Claims translated as they are, though not in `business.json` facts: „500+ принтирани проекта“, „Качествени материали“. Confirm or remove (Rule 5).
4. ⚑ A product added **from the phone** arrives without English copy: `/en/products/` shows it in Bulgarian (marked `lang="bg"`) and the unit tests list it as *pending*, not failed. OK, or should the phone form ask for English too?
5. ⚑ English contact-form submissions are tagged "(English)" in the sender name — useful, or noise?
6. ⚑ Remember the chosen language / suggest English to English browsers? (Today: neither — L10.)
7. Visual regression baselines need regenerating after merge (the navbar changed on every page): run the *Visual regression* workflow with "update baselines".
8. Accept the `app.component.scss` budget warning, or raise `anyComponentStyle` to 14 kB?

## 7. Next steps (not done)

**Blog localization** — deferred by the owner on 2026-10-18; recommended approach:

- **B1 (done):** blog Bulgarian-only; English pages say so; the switcher on a post goes to `/en/`.
- **B2 — translation-set infrastructure, no content yet:**
  - registry entries get `locale` and a `translationKey` linking a post to its translations (the Hugo / WPML model); each translation is its own page with a **localized slug** (`/en/blog/pla-vs-pla-plus/`), self-canonical, hreflang only between real pairs;
  - one generic article component fed by the registry instead of one component per post (18 today); per-post extras (video, FAQ) become registry options;
  - `/en/blog/` index listing only English posts; the switcher on a translated post goes to its translation, otherwise to `/en/blog/`;
  - `applyBlogPostSeo` with localized breadcrumbs and `inLanguage`; sitemap, llms.txt and the internal-link check learn `/en/blog/`; the auto-blog pipeline gains an optional "draft the English version" step in the same PR, **never auto-published**.
- **B3 — translate 3–5 evergreen posts** with English search demand (PLA vs PLA+, infill, PLA smoothing, lithophane), localize keywords rather than translate them literally, owner review; watch Search Console / Bing for 2–3 months before translating more. Skip Bulgaria-only topics (euro coin card).

**Other**
- `@defer` the switcher's menu (load the drop-down on first interaction / idle): −9 kB initial transfer; needs the trigger's keyboard handling re-done without `igxDropDownItemNavigation`.
- `<link rel="modulepreload">` for the English chunk in the prerendered `/en/…` pages, so it downloads in parallel with `main.js` instead of after it; needs a postbuild step that knows the chunk's hashed file name.
- Add the English pages to Lighthouse CI (`lighthouserc.js`) and to the visual baselines (`ENGLISH_ROUTES` → `CORE_ROUTES`) when regenerating them.
- After deploy: `npm run check:live`; IndexNow pings the new / changed URLs automatically; check Search Console's page indexing for `/en/…` after a week or two.
