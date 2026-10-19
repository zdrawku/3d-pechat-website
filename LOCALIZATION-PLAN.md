# Localization plan — 3dpechat.bg in more than one language

> **Status (2026-10-18):** Bulgarian + English implemented on branch
> `localization-branch`; the owner reviewed and committed it.
> Language switcher design **A approved** by Zdravko the same day
> ([artifact](https://claude.ai/artifact/CXV3F2jyajD7vkb7thGBmx)).
>
> **Blog (2026-10-19):** phases B2–B3 built on the same branch, **uncommitted**.
> English blog design **B approved** by Zdravko
> ([English Blog Variants](https://claude.ai/artifact/9LhQasqnhCXg6DJdUAhXff)):
> `/en/blog/` with 8 translated posts — the 4 planned evergreen guides plus the
> Sofia video, Sofia local services (owner's picks), StandStrap and the euro
> coin card (agent's picks, ⚑). See [§3b](#3b-blog-in-english-2026-10-19).
>
> **End to end (2026-10-19, later, uncommitted):** at the owner's request the
> rest of §7 too — every post (Bulgarian and English) now served by one
> component and one route per language, the auto-blog pipeline drafting the
> English version in the same PR (`npm run translate-post` for existing posts),
> leva amounts converted to euro, the deferred language menu (−8.5 kB initial),
> the English chunk + article texts preloaded, English pages in Lighthouse CI
> and the visual suite. See [§3c](#3c-end-to-end-2026-10-19).
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
| L5 | ~~The blog stays Bulgarian-only for now~~ → **posts are translated one by one** (2026-10-19) | Was: English pages labelled the link "Blog (in Bulgarian)". Now `/en/blog/` lists the translated posts; each translation is its own page with its own English slug, paired with the original by hreflang; untranslated posts stay Bulgarian with no hreflang. See L14–L19. |
| L6 | **One source for languages: `src/i18n/locales.json`** | Routes, hreflang, the switcher, footer links, sitemap alternates, llms.txt and the live check all read it (Rule 5 spirit). |
| L7 | **Translation files per page and language** (`src/i18n/<lang>/<page>.json`) + **content overlays** (`en/content/products.json` by `linkId`, `faq.json`, `videos.json`) | Small, reviewable diffs; "add a language" = copy the `en/` folder and translate. Data stays in `src/data/` (images, links, dates); overlays only carry visible copy, so a translation can't break an image or link. |
| L8 | **Switcher: design A** — globe + code pill in the navbar opening an `igx-drop-down` that lists languages by their own names, plus plain footer links ✅ | Approved. Scales to any number of languages; native names (no flags — flags are countries, not languages). The drop-down's items exist only while it's open, so the footer links give crawlers a plain `<a hreflang>` path. |
| L9 | **SEO:** each language version self-canonical; `hreflang` bg / en / **x-default → Bulgarian** on every main page, in the page head **and** the sitemap; `og:locale` per language; `<html lang>` per route | Google's recommended setup. x-default = Bulgarian because it's the primary market. |
| L10 | **No automatic redirect by browser language**, no remembered preference | Auto-redirects hide pages from crawlers (Googlebot crawls from the US with English) and annoy people who chose a language. ⚑ A dismissible "This page is available in English" hint is possible later. |
| L11 | **Google reviews are not translated** — shown in Bulgarian with `lang="bg"` and a one-line note on English pages | They are real customers' words (Rule 5 `neverClaim`: no invented reviews; a translation would put words in their mouths). |
| L12 | **Business numbers enter translations as `{placeholders}`** from `business.json` | Rule 5; the spec rejects euro amounts and hour counts typed into any translation. |
| L13 | **Bundle:** Bulgarian shared strings in the main bundle; each page's Bulgarian strings stay in its lazy chunk (`registerPage()`); English is one lazy chunk | Measured, see §4. |
| L14 | **Which posts are translated, and their slugs: `translatedPosts` in `locales.json`** (Bulgarian slug → English slug); the English copy and dates in `en/content/blog.json`; the text in `src/assets/blogs/en/<slug>.md` | §7 first suggested `locale` + `translationKey` fields in `blog-posts.registry.ts`. Rejected: the sitemap, llms.txt, internal-link and auto-blog scripts parse that file by regex, and English entries there would leak into all of them (the auto-blog would even link Bulgarian articles to English ones). `locales.json` is already what routes, hreflang, the switcher, the sitemap, llms.txt and the live check read; the slug map is tiny (it must be in the main bundle for the switcher and hreflang), while the English copy loads with the lazy English chunk (L7, L13). |
| L15 | **One component for every post, in every language** (`blog/article/`), and **one `:slug` route per language** | First built for translations only (the 16 Bulgarian post components and their generated routes were kept so the auto-blog scaffolder stayed as it was); the owner then asked for the whole pipeline, so the Bulgarian components and the scaffolder's route editing are gone. A `canMatch` guard accepts only a post that exists in that language (registry / `translatedPosts`; anything else is the 404), a resolver loads the text from that language's lazy chunk, and `app.routes.server.ts` prerenders every post from the same lists. Per-post extras (video, CTA, MakerWorld link) are `ARTICLE_EXTRAS` entries, shared by all of a post's languages. |
| L16 | **Design B** ✅ — English posts only on `/en/blog/`, one „More articles in Bulgarian“ card (`hreflang="bg"`), and a „Read in Bulgarian“ / „Прочетете на английски“ link beside „Back“ on every translated pair | Approved 2026-10-19. The link lives in `<app-article-toolbar>`, part of the one article page, so a new translation shows up on the Bulgarian original with no edit there. The back link is now an `<a>` (crawlable, middle-click) instead of a `<button>` + `router.navigate`. |
| L17 | **A translated post's FAQ schema is read from its text** (`<!-- faq -->` … `<!-- /faq -->`) | The Bulgarian posts keep their FAQ twice (TS array + markdown, synced by a spec); for translations the visible `### question` + answer text *is* the source, so they can't drift. |
| L18 | **„Keep reading“ on an English post matches English copy**, among English posts; products are matched on the Bulgarian original (their tags are Bulgarian) and shown with their English names | Matching on the Bulgarian originals found almost no overlap among 8 posts and fell back to the newest ones. English stems were added to the generic-word list; every Bulgarian post's related links are unchanged (checked). |
| L19 | **Bulgarian posts' `dateModified` not bumped** for the new hreflang / language link | Their text didn't change (Rule 5.3: no fake dates). Crawlers get the pairs from the page head and the sitemap's `xhtml:link`s; IndexNow pings the new `/en/` URLs and `/blog/`. ⚑ Bump them if you want Bing to recrawl the originals sooner. (The 5 posts whose leva amounts became euro were bumped — their text did change.) |
| L20 | **The auto-blog drafts the English version in the same PR**, normalised in code | The plan said "optional, never auto-published": the PR is reviewed before anything goes live, and a failed draft leaves a Bulgarian-only PR. Code, not the model, guarantees the links point at English pages (a link to a Bulgarian-only post is unwrapped), the H1 equals the title, the slug is unique kebab-case and the description fits a snippet; the scaffolder writes `locales.json` / `blog.json` in their own layout so the diff is only the new lines. |
| L21 | **Language menu deferred** (`@defer (when requested; prefetch on idle)`) | The pill stays in the main bundle; the menu (Ignite's drop-down module) loads when the browser is idle or on the first click, which opens it. The pill forwards its keys to the menu (igxDropDownItemNavigation's behaviour, which can only sit inside the menu's template). Initial transfer −8.5 kB. |
| L22 | **Postbuild preloads** the English strings on `/en/` pages and the article texts on post pages | Angular preloads a route's own chunks, not what the app initializer (strings) or a resolver (texts) imports; without the preload those download only after `main.js` runs. Found by a string / marker in the chunk, so no hashed file name needs to be known. |

## 3. What was built

**Runtime (`src/app/i18n/`)**
- `locales.ts` — the registry (from `locales.json`), loaders, URL helpers (`splitLocalePath`, `localizePath`, `languageAlternates`, `switchLocaleUrl`).
- `i18n.service.ts` — active language (signal), on-demand loading (the latest `use()` wins), `t()` / `plural()` (Intl.PluralRules), Intl number / list / month formatting, `langIfForeign()` (marks Bulgarian-only content on other languages' pages), `registerPage()`, owns `<html lang>`.
- `translate.pipe.ts` — `t` (typed keys) and `localizePath` pipes.
- `provide-i18n.ts` — app initializer (language from the URL before the first render, so prerender and hydration agree; if that language's strings don't load, the page reloads once, then stays as prerendered), `localeGuard` (switches language on navigation), and a re-sync from the URL of the page shown after every finished, cancelled or failed navigation (a newer click can cancel a navigation whose guard already switched the language).
- `localized-content.ts`, `business-copy.ts` — gallery / product / video copy overlays; address and opening hours per language.
- `app.routes.ts` — `/en/` subtree generated from `locales.json` (the English blog since 2026-10-19, §3b); Bulgarian pages, blog and 404 in Bulgarian. The Bulgarian blog block keeps the shape the auto-blog scaffolder's regex expects.

**UI**
- `shared/language-switcher/` — approved design A (`igxButton` + `igx-drop-down` + `igxToggleAction` + `igxDropDownItemNavigation`), keyboard operable, compact under 420 px.
- Shell, home, portfolio, products (+ grid), prices (+ calculator), contact, FAQ, reviews, review snackbar, video, 404/500: all strings through `t`, links through `localizePath`, numbers from `business.json`.
- Phone navbar: under 420 px the bar padding halves (Ignite spacing token) and the controls sit 6 px apart; under 350 px the menu pill drops its „Меню“ label. Verified on screen at 320 / 360 / 390 / 420 px.
- Contact form: hCaptcha in the page's language; English enquiries arrive as "3dpechat.bg contact form (English)" ⚑.

**Content (`src/i18n/`)** — Bulgarian source files (verbatim from the templates), English translations of all UI copy, all 14 products, the 10 FAQ answers, the video alt text and the alt text of all 33 captioned gallery images (`en/content/gallery.json`, keyed by image `src`; named like the English catalogue).

**SEO / scripts** — `SeoService.applyPageSeo(page)`; hreflang derived for every localized page; sitemap with `xhtml:link` alternates (27 URLs); llms.txt gets an English section; the live check verifies that the sitemap lists every language version, `lang` + `hreflang` on every sitemap URL (in any order) and English numbers / address.

**Docs** — `src/i18n/README.md`, CLAUDE.md Rule 6, AI_INSTRUCTIONS.md, `src/data/README.md`, the `/add-product` skill (drafts English too), the phone add-product PR checklist, AI-VISIBILITY-PLAN.md Phase 5 note, FEATURE-IDEAS-PLAN.md artifact row.

## 3b. Blog in English (2026-10-19)

**Content** — 8 posts, translated by the agent from the Bulgarian originals under a brief built from `business.json` facts / `neverClaim` (British spelling, English search phrases in titles and headings, links only to English pages), then checked: facts, links, markers, titles vs copy.

| Bulgarian post | English URL |
|---|---|
| PLA, PLA+, PLA Pro и PLN | `/en/blog/pla-vs-pla-plus-vs-pla-pro-vs-pln/` |
| Infill при 3D печат | `/en/blog/3d-printing-infill-density-strength/` |
| Изглаждане на PLA | `/en/blog/how-to-smooth-pla-prints/` |
| Литофан с 3D принтиране | `/en/blog/3d-printed-lithophane-from-photo/` |
| 3D принтиране в София (local services) | `/en/blog/3d-printing-in-sofia-local-service/` |
| Вижте как работим (video) | `/en/blog/custom-3d-printing-sofia-video/` |
| StandStrap ⚑ (own design, MakerWorld's audience is international) | `/en/blog/standstrap-3d-printed-snowboard-stopper/` |
| Монетна карта ⚑ (euro coin collectors abroad; in the English catalogue) | `/en/blog/bulgarian-euro-coin-holder-card/` |

**Runtime** — `locales.ts`: `TRANSLATED_POSTS`, `blogPostPath()`, `blogPostLocales()`, `blogPostAt()`; `languageAlternates()` and `switchLocaleUrl()` handle posts (switcher on a translated post → its translation, on any other post → that language's blog). `localized-content.ts`: `translateBlogPost()`, `blogPostsIn()`. `I18nService.languageName()` (Intl.DisplayNames: „английски“ / "Bulgarian"). `SeoService.applyBlogPostSeo(slug)` works in every language: copy from the translation, hreflang between real pairs, `inLanguage`, localized breadcrumbs, `| 3dpechat.bg` title suffix off Bulgarian. `app.routes.ts`: `translatedBlog(locale)` under `/en/` (kept a function call so the auto-blog scaffolder can't mistake it for the Bulgarian blog).

**UI** (design B, Ignite components) — `blog/shared/article-toolbar/` (back link + language link), the article page (at first `blog/translated-post/` for translations only; since §3c `blog/article/` for every post), `ARTICLE_EXTRAS` (video player, StandStrap clip, CTA buttons, MakerWorld link), `blog/shared/article-markdown.ts` (video split, MakerWorld section, FAQ from text). Blog index, related content, product „read more“ links and the menu / footer blog links are language-aware; English nav says "Blog" (was "Blog (in Bulgarian)"). Strings in `src/i18n/<lang>/blog.json`; `/blog/` joined `localizedPages`.

**Scripts** — `generate-blog-content.js` bundles `src/assets/blogs/en/*.md` into `blog-content.translations.generated.ts` (and stops the build when a registered translation has no file); sitemap lists the English blog and posts with `xhtml:link` pairs (36 URLs); llms.txt lists the English posts; the live check expects post pairs and every translated URL in the sitemap; the internal-link normaliser knows the English pages.

**Fixed on the way** — the auto-blog scaffolder's route regex matched a *comment* in `app.routes.ts` (added with the 2026-10-18 localization), so the next auto-generated post would have been routed at `/<slug>/` instead of `/blog/<slug>/`. Fixed first by anchoring the regex; since §3c the scaffolder doesn't touch `app.routes.ts` at all.

## 3c. End to end (2026-10-19)

The owner asked for "the whole end to end process to work at 100%" and the rest of §7.

**One page for every post** — `src/app/blog/article/`: `article.routes.ts` (one `:slug` route per language: `canMatch` = the post exists in that language, resolver = its text from that language's lazy chunk), `article.component.ts` (the page; follows the route's data because the router reuses it from post to post — a related-post click would otherwise keep showing the first post), `article-extras.ts`. `app.routes.server.ts` prerenders every post from the registry and `translatedPosts`. The 16 Bulgarian post components, their 16 routes and `BlogService`'s bundled texts are gone; the blog index and related content no longer download every article. Bulgarian FAQ sections carry `<!-- faq -->` markers, so the Sofia and A1 Combo posts gained FAQPage schema; the video and coin card posts' schema is unchanged word for word. The StandStrap caption moved to its registry entry (`videoCaption`). The coin card's two buttons moved below the article, like the video post's (inside the article they took the article's link colour).

**Auto-blog end to end** — `scaffold-post.js` (markdown + registry entry; translation files), `translate-article.js` (English draft via Claude + normalising), `translate-post.js` (`npm run translate-post -- <slug>` for an existing post), `faq-markers.js`, `json-format.js`, `env.js`; `index.js` runs: preflight → topic → Bulgarian article → cover → file it → English draft → file it → images / content maps / sitemap / llms.txt; one PR, checklist covers the English draft. The generator prompt asks for euro only and for the FAQ heading the page turns into schema. `generate-blog-images.js` rewrites image references in every language's markdown (no component files any more).

**Leva → euro** — every amount in the 5 Bulgarian posts that had them (PLA, technologies, 3D printed shoes, Warhammer, making money) and the English PLA post: 1 € = 1.95583 лв, rounded **up**: whole euros from €10 (a range at the precision of its upper end), 10 cents below; worked examples recomputed so they still add up (material 150 g × 21 €/kg = 3,15 €, costs ≈ 6 €, 10 participants × 26–52 € = 260–520 €). `blog-posts.registry.spec.ts` now fails on an amount in leva in any language.

**§7 "Other"** — deferred language menu (L21), preloads (L22), English pages in Lighthouse CI (`lighthouserc.js`: `/en/`, `/en/prices/`, `/en/blog/`, an English post) and in the visual suite (`e2e/visual.spec.ts` runs `CORE_ROUTES` + `ENGLISH_ROUTES`), e2e post lists read from the registry and `locales.json` (the hand-written list had missed 3 posts), and a pre-deploy rehearsal of the live check against the local build (`node scripts/check-live-site.js --base http://localhost:8080`).

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

**Blog (2026-10-19):**

| Check | Result |
|-------|--------|
| `npm run build` | ✅ 40 static routes (+ `/en/blog/` and 8 posts), all internal links canonical |
| Unit tests | ✅ 291 (37 added: post URL helpers, routes, translation contract for the blog, translated-post / toolbar / markdown markers, English blog index, related content and product links in English, SEO of translated posts) |
| `npm run test:scripts` | ✅ 57 (49 before: sitemap post pairs + lastmod, llms.txt English posts, live-check post pairs, scaffolder route insertion) |
| Playwright functional suite | ✅ 198 (148 before) — every English post loads, sitemap, hreflang pairs both ways, switcher + language link click-through, `/en/blog/` pointer, axe on `/en/blog/` and the toolbar |
| Bulgarian pages vs production (head tags + visible text, 22 pages) | ✅ identical except hreflang / `og:locale:alternate` on `/blog/` and the 8 translated originals, and their new language link |
| Screenshots light / dark, desktop / 390 px | ✅ matches design B (the pointer card needed `flex-direction: row`, fixed) |

Bundle: initial transfer 232.9 → 233.7 kB (**+0.8 kB**: the slug map and post helpers). The 8 English texts are a lazy 23 kB chunk, loaded only on English posts.

**End to end (2026-10-19, §3c):**

| Check | Result |
|-------|--------|
| `npm run build` | ✅ 40 static routes; preloads added (English strings on 14 `/en/` pages, Bulgarian texts on 16 posts, English texts on 8); all internal links canonical |
| Unit tests | ✅ 293 (the 3 per-post specs became `article.component.spec.ts`, every post in both languages through the real routes, incl. post-to-post navigation and 404s; deferred menu; leva guard; routes + prerender params) |
| `npm run test:scripts` | ✅ 72 (scaffolder: registry entry, translation files and their layout, FAQ markers, preflight; English draft: prompt facts / links / markers, link mapping, normalising; preloads; prompt's euro rule) |
| Playwright functional suite | ✅ 207 (198 before: the 3 posts the hand-written list had missed) |
| Bulgarian pages vs production | ✅ identical except the intended: hreflang + language link (§3b), euro amounts and bumped `dateModified` on the 5 converted posts, FAQPage schema added to the Sofia and A1 Combo posts |
| Live check against the local build | ✅ every check (36 sitemap URLs, lang + hreflang, schema, legacy redirects, llms.txt, FAQ) except the two slash redirects: the local server answers 302 where GitHub Pages answers 301 |
| Screenshots | ✅ deferred menu (design A) light / dark, desktop / phone; coin card buttons |

Bundle: initial transfer 233.7 → **225.1 kB** (−8.6 kB: the deferred menu). The Bulgarian article texts (63 kB) now load only on Bulgarian posts, preloaded.

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
- Found while translating (2026-10-19) — in the **Bulgarian originals**, not changed there; the English versions already differ as noted:
  - Infill: the strength figures contradict each other (20 % infill = 60–70 % of full strength, yet 20 → 100 % adds only 20–30 %) — kept in English too, please check; the orientation tip says to load parts *perpendicular* to the layers (their weak direction) — English corrected; the „Поръчвате?“ box says density sets print hours and therefore the price — English says we price by weight (business.json).
  - Smoothing: XTC-3D mixed 1:1 — the manufacturer's ratio is 2:1 by volume (English says so; please verify); the closing CTA promised „професионална постобработка“ and „различни материали“, not in the facts — English rewritten from the facts.
  - ✅ PLA (and 4 other posts): prices in leva — converted to euro in both languages (§3c); they are third-party shop prices, please confirm they're current.
  - Lithophane: "Cura Lithophane Plugin" (Cura imports images itself) and the reason for printing upright were wrong — English corrected; its table now says resin = SLA printers (general information).
  - Sofia local services: the comparison claimed "instant" communication and "express logistics" — English says direct contact and simple local delivery (no same-day hint).
- `src/i18n/en/content/products.json` names `variant-3` "…in plain blue", though the card is blue with yellow stars; the English coin card article uses that name to match the catalogue.
- Bulgarian posts' visible FAQ lives twice (component array + markdown); translations read it from the text (L17). Could be unified later.

## 6. Questions for the owner

1. ⚑ **`/en/` = translated home page** (old English landing removed). Keep, or restore the landing as the English home?
2. ⚑ **English copy** is the agent's translation (British spelling, like the 2026-10-17 page; `og:locale` stays `en_US`). Please read at least the page titles / descriptions (`src/i18n/en/seo.json`), the home hero and the FAQ.
3. ⚑ Claims translated as they are, though not in `business.json` facts: „500+ принтирани проекта“, „Качествени материали“. Confirm or remove (Rule 5).
4. ⚑ A product added **from the phone** arrives without English copy: `/en/products/` shows it in Bulgarian (marked `lang="bg"`) and the unit tests list it as *pending*, not failed. OK, or should the phone form ask for English too?
5. ⚑ English contact-form submissions are tagged "(English)" in the sender name — useful, or noise?
6. ⚑ Remember the chosen language / suggest English to English browsers? (Today: neither — L10.)
7. Visual regression baselines need regenerating (the navbar changed on every page, and the English pages are now in the suite with no baselines yet): run the *Visual regression* workflow with "update baselines" on this branch before merging, or right after.
8. Accept the `app.component.scss` budget warning, or raise `anyComponentStyle` to 14 kB?
9. ⚑ **Read the 8 English posts** (agent translations, `src/assets/blogs/en/`), at least their facts-related changes listed in §5, and the titles / descriptions / slugs in `src/i18n/en/content/blog.json` + `locales.json`. Slugs are permanent once published (Rule 5.5).
10. ⚑ StandStrap and the euro coin card were added beyond the plan's four + your two (L5); drop either by removing its line from `translatedPosts`, its `blog.json` entry and its `.md`.
11. ⚑ Bump the 8 Bulgarian originals' `dateModified` so IndexNow re-pings them (L19)?

## 7. Next steps

**Done** (2026-10-19, §3b–§3c)
- ✅ B1–B3: the English blog, 8 posts.
- ✅ The auto-blog drafts the English version in the same PR (L20); `npm run translate-post -- <slug>` for existing posts.
- ✅ Every post on one component and one route per language (L15); FAQ schema from the text for every post (L17).
- ✅ `@defer` language menu (L21), English strings + article texts preloaded (L22).
- ✅ English pages in Lighthouse CI and the visual suite; e2e post lists derived from the registry / `locales.json`.
- ✅ Live check rehearsed against the local build.

**Left — only the owner can do these**
- Run the *Visual regression* workflow with "update baselines" (§6, 7) — its baselines are Linux screenshots made on CI.
- After deploy: `npm run check:live` (the weekly *Live site check* workflow also runs it); IndexNow pings the new / changed URLs by itself; look at Search Console's page indexing for `/en/…` and `/en/blog/…` after a week or two.
- In 2–3 months, with Search Console / Bing data: translate more (`npm run translate-post -- <slug>` each). Candidates with English demand: transparent PLA, the Bambu Lab A1 Combo post. Keep Bulgaria-only topics Bulgarian.
