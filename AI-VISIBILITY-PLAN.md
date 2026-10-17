# AI Visibility Plan — staying the first pick in ChatGPT and other AI assistants

> Drafted 2026-10-16 by Claude (Opus 5.5) for an implementing agent.
> **Status (2026-10-17):**
> - **Phase 0:** all decisions are in (see the Decisions log). Only the owner's
>   baseline prompt run is still open.
> - **Phase 1:** ✅ merged to `main` (PR #45, `a1606b3`) and live, together
>   with the D3/D4 content fixes and the agent instructions (CLAUDE.md Rule 5).
>   `zkolev/seo-fixes` was **not** merged; its changes were ported file by file.
>   Still owner-side: the Search Console steps and the slashes in the Google
>   listing description (Step 1.1).
> - **Phases 2 and 3:** ✅ merged (PR #46, `f418174`) and live; `npm run
>   check:live` passed 44/44 on 2026-10-17. 2.6 (512 px logo) was done in the
>   Phase 4–7 batch. Owner-side still open: GBP updates, Bing Webmaster Tools,
>   Bing Places, Apple Business Connect, and one manual deploy run with
>   `indexnow_all`.
> - **Phases 4–7:** implemented 2026-10-17, uncommitted on
>   `discoverability-ai-improvements`, awaiting review. The owner asked the
>   agent to decide open questions itself; every such decision is in the
>   Decisions log, marked „agent“.
>   - Design canvas: https://claude.ai/artifact/G9ZMwauxMhKhvngFyvZ4W7. The agent
>     picked FAQ A, `/en/` A and card A.
>   - Phase 4: the FAQ on `/prices/` and the buyer-intent topic queue.
>   - Phase 5: `/en/`.
>   - Phase 6: drafts handed over outside the repo.
>   - Phase 7: the live-site check and its weekly workflow.
>
> **Workflow (the owner's rule):**
> - All work happens on the `discoverability-ai-improvements` branch.
> - **The agent never commits, stages, pushes or opens PRs.** It leaves changes
>   in the working tree, ends each step with a list of changed files, and the
>   owner (Zdravko) reviews and commits.
> - Work through the phases and steps in order. A ⛔ STOP means the owner must
>   answer or approve before you continue: do not guess past it.
> - When a step or phase is done, update this status block and tick its "Done
>   when" items.
>
> Read [`CLAUDE.md`](CLAUDE.md) first. Every rule there applies. These bite
> here: **Rule 1** (Ignite UI components only), **Rule 2** (design artifact
> before user-facing work, so Phases 4–5 start with one), **Rule 3** (all copy
> is Cyrillic; never edit through PowerShell 5.1), **Rule 4** (facts live in
> JSON, imported at build time) and **no `Review`/`AggregateRating` schema**.

## Why this plan exists

On 2026-10-16, ChatGPT answered a Bulgarian question for companies in Sofia
doing custom work with **3dpechat as the first business card**. The card's data
(name „3dpechat“, „Kv. Vitosha, … 110 б, 1700 Sofia“, phone, photo) comes from
a **business listing**. For local questions ChatGPT runs a Bing search, and
Bing Places is the best-documented listing source. The one-line description
(„…включително малки серии“) paraphrases **our homepage copy**.

Why it works today:
- Since July 2026 every route is prerendered as complete HTML, and AI crawlers
  mostly don't run JavaScript.
- `robots.txt` allows every crawler, and GitHub Pages has no bot-blocking layer
  in front.
- 18 Bulgarian articles cover the topic, so there is little competition.
- The Organization schema uses the same phone number as the listing.

Weak spots this plan fixes:

1. 9 of 22 sitemap URLs are not indexed in Google. The fixes are written but sit
   unmerged on `zkolev/seo-fixes`. Phase 1 ports them step by step.
2. The business appears under four different names.
3. There is no Bing presence: no Webmaster Tools verification and no IndexNow.
4. Answer-ready facts are missing: lead time, delivery, accepted files,
   minimums.
5. A web search finds **zero third-party mentions** of the business. That is the
   biggest risk and the biggest upside.

## 0. Facts (verified 2026-10-16; Google listing rows 2026-10-17)

| Item | Value | Where it comes from |
|------|-------|---------------------|
| Google Business Profile name | `3dpechat` | Place ID comment in [`site-links.ts`](src/data/site-links.ts) |
| Google Place ID | `ChIJZ512pmOFqkARSxCaV9bE1og` | `GOOGLE_REVIEW_URL` in `site-links.ts` |
| Google Maps CID | `9860284859046039627` → `https://www.google.com/maps?cid=9860284859046039627` | decoded from `0x88d6c4d6579a104b` in `GOOGLE_MAPS_PROFILE_URL` |
| Coordinates | `42.640588, 23.3342435` | `GOOGLE_MAPS_PROFILE_URL` |
| Address as Google lists it | „кв. Витоша, бул. „Симеоновско шосе“ 110 б, 1700 София“ · Plus Code `J8RM+6M София` | Google Business Profile, viewed 2026-10-17 |
| Listing hours | Every day, 9:00–18:00 (Mon–Sun) | Google Business Profile, viewed 2026-10-17 |
| Listing category / rating | „3D печатна услуга“ · 5.0 from **15** reviews | Google Business Profile, viewed 2026-10-17 |
| Competitors Google shows next to us | 3D Open Design 5.0 (**35**) · Bulgaria 3D print 4.6 (**53**) · MADS 3D PRINTS 4.2 (5) | „Хората търсят също“ on the listing, 2026-10-17 |
| Listing description | Mentions a free consultation, a reply within 24 h, links to /contact, /portfolio, /products, /prices (**no trailing slash**), phone/Viber, Instagram, TikTok | Google Business Profile, viewed 2026-10-17 |
| Prices | Per 10 g: 0.80 € / 1.00 € / 1.25 € / 1.50 € across four tiers; standard PLA colors in stock, other colors on request | [`prices-page.component.ts`](src/app/prices-page/prices-page.component.ts) `pricePerTenGrams` |
| Address on the site today | „Симеоновско шосе 110Б, ет.2“, with **no postcode and no кв.** | footer [`app.component.html:251`](src/app/app.component.html#L251), JSON-LD in `index.html`/`404.html` |
| Phone / email | `+359883310616` / `3dpechat.bg@gmail.com` | JSON-LD; the phone matches the listing |
| Names in use | „3dpechat“ (GBP, ChatGPT card) · „3D Печат България“ (JSON-LD `name`, `SeoService.siteName`, llms.txt H1) · „3D печат услуги“ (static `og:site_name` in `index.html`/`404.html`) · „3D Печат Услуги“ (YouTube channel) | grep |
| `robots.txt` | `User-agent: *` / `Allow: /` + sitemap. **Keep it.** | [`src/robots.txt`](src/robots.txt) |
| `llms.txt` | Generated in `prebuild` by [`generate-llms.js`](scripts/generate-llms.js). Its summary claims „FDM, SLA и SLS печат“. **That's wrong: the owner offers FDM only (D3).** | `generate-llms.js:59` |
| Meta keywords | `index.html:59` and `404.html:37` list „3D сканиране“. **That's wrong too: no scanning service (D3).** Blog posts explain SLA, SLS and scanning as general information, which is fine. | grep |
| Bing | No `msvalidate.01` meta, no `BingSiteAuth.xml`, no IndexNow anywhere in the repo | grep |
| Unmerged SEO fixes | `zkolev/seo-fixes`: 2 commits ahead of main, 9 behind, 84 files changed; a dry-run merge conflicts in 6 files. **Decision 2026-10-17: don't merge it; port it step by step (§Phase 1).** | `git merge-tree` |
| Deploy | [`github-pages.yml`](.github/workflows/github-pages.yml) runs on every push to `main`, and **copies the built `index.html` over `404.html`** | workflow |
| Hosting | GitHub Pages: no server logs, no redirect config, no edge bot-blocking | — |

## 1. What already exists (don't rebuild it)

- **Site-wide JSON-LD** `<script type="application/ld+json" id="organization-jsonld">`
  in [`src/index.html`](src/index.html) and [`src/404.html`](src/404.html), with
  `"@id": "https://3dpechat.bg/#organization"`. **Keep that `@id` and the
  script `id`.** [`video.util.ts:68`](src/app/shared/youtube-embed/video.util.ts#L68)
  points `publisher` at it, and its spec asserts that.
- **Per-page SEO** goes through `SeoService.updateSeo()` / `setStructuredData()`
  ([`seo.service.ts`](src/app/services/seo.service.ts)). `setStructuredData`
  **replaces** the previous page's per-page script, so combine several schemas
  on one page in a single `@graph`.
- **e2e SEO tests** in [`e2e/seo.spec.ts`](e2e/seo.spec.ts). One test asserts
  `@type === 'Organization'` plus `sameAs`, and Phase 2 must update it.
- **Shared external URLs** (Google review, Maps, YouTube) live in
  [`src/data/site-links.ts`](src/data/site-links.ts).
- **Generators** run in `prebuild`: sitemap, llms.txt, blog content, images.
- **Excluded Ignite components** (no CSS emitted): see `$exclude-components` in
  [`src/styles.scss`](src/styles.scss). That list includes `igx-expansion-panel`,
  which matters for Phase 4.
- **Review CTA**: the footer and Happy Customers already link to `GOOGLE_REVIEW_URL`.

---

## Phase 0 — Owner decisions and baseline

Phase 0 changes no code. Put the questions to the owner (AskUserQuestion where
options fit), and record the answers in the **Decisions log** at the bottom of
this file.

| # | Decision | Status |
|---|----------|--------|
| D1 | The canonical business name, used in schema, `og:site_name`, `SeoService`, llms.txt and every listing | ✅ **`3dpechat`**, exactly as the Google listing shows it. `alternateName: ["3dpechat.bg", "3D Печат България"]`. The listing name doesn't change. |
| D2 | Opening hours | ✅ **Every day, 9:00–18:00**, matching the Google listing. Never write „по предварителна уговорка“. |
| D3 | Technologies actually offered | ✅ **FDM only.** No SLA, no SLS, no 3D scanning. |
| D4a | `priceRange` for the schema (needed in **Phase 2**) | ✅ **`€`**: 0.80–1.50 € per 10 g, with a 3 € minimum order. |
| D4b | FAQ facts (needed in **Phase 4**) | ✅ Answered 2026-10-17. See the list below. |
| D5 | English landing page `/en/` | ✅ **Yes**, in Phase 5. |
| D6 | The exact address string for the footer, contact page and schema | ✅ „кв. Витоша, бул. „Симеоновско шосе“ 110 б, ет. 2, 1700 София“. This is the Google listing's format plus the floor. |

**D4b: the owner's answers (2026-10-17).** Use only these in copy, FAQ and
schema.
- **Price:** by weight, 0.80 / 1.00 / 1.25 / 1.50 € per 10 g depending on the
  tier. **Minimum order 3 €.** The calculator applies it.
- **Lead time:** small items 1–3 working days; larger items or small series 3–7
  working days. Rush orders are possible when the queue allows, for **+30%**.
- **Replies** within 24 h; the consultation is free.
- **Files:** STL, 3MF (preferred), OBJ, STEP. The contact form takes **no**
  attachments (Web3Forms Pro feature), so files go by email or Viber.
- **3D modeling (final, owner 2026-10-17):** the initial offer is free. The
  modeling price depends on the complexity, meaning the time spent modeling, and
  the customer learns it from the offer before work starts. **No fixed price
  figure** (the earlier 10 € / 15–25 €/h suggestion is dropped).
- **Languages (owner 2026-10-17):** inquiries are answered in Bulgarian and
  English.
- **Materials:** PLA is the main material and the only one stocked. The printer
  can also print others (e.g. PETG, TPU), which are bought on demand for a
  specific order.
- **Maximum size:** up to 25 × 25 × 25 cm in one piece (Bambu Lab A1:
  256 × 256 × 256 mm). Larger items are printed in parts and glued.
- **Delivery:**
  - In Sofia: in person or by city courier, arranged by phone call or message.
  - The rest of Bulgaria: Econt or Speedy, to an office, an address or a parcel
    locker. The customer pays the courier's rate, and cash on delivery is
    available.
  - **Free delivery over 100 € anywhere in Bulgaria** (owner, 2026-10-17). Below
    100 € the courier's rate applies.
- **Payment:** cash on pickup, Revolut transfer, or cash on delivery through the
  courier.
- **Invoices:** none for now (sole trader). The owner states the given prices
  include VAT.
- **Facebook page:** none.

**Baseline:** the owner runs the Phase 7 prompt panel in a private window and
shares the results. The agent fills in the first rows of the **Monitoring log**.

**Owner tasks that can start right away**, with no dependency on code: the Bing
and Apple listing steps in Phase 3 and the off-site checklist in Phase 6.

**Done when:** D1–D6 except D4b are answered (D4b may wait for Phase 4), and the
baseline rows are filled in.

---

## Phase 1 — Port the SEO fixes from `zkolev/seo-fixes`, step by step

**Why:** only 13 of 22 sitemap URLs are indexed in Google, and the
`zkolev/seo-fixes` branch fixes exactly the causes. Gemini and Google's AI
Overviews draw on Google's index, and the same quality issues hurt Bing, which
ChatGPT's local answers start from.

**The owner's decision (2026-10-17):** the branch is too big to merge in one go
(84 files). **Don't merge, rebase or cherry-pick it.** Port it as the small steps
below, on `discoverability-ai-improvements`.

Each step is one review unit. Do one step, verify it, list the changed files,
and ⛔ **stop so the owner can review and commit** before the next step.

**How to port**
- Read the reference with `git diff main...zkolev/seo-fixes -- <paths>` and
  `git show zkolev/seo-fixes:<path>`.
- **New files** (absent on main): write them out in Git Bash, e.g.
  `git show zkolev/seo-fixes:<path> > <path>`. This is byte-exact. Never use
  PowerShell (Rule 3). Never use `git checkout <branch> -- <path>`, because it
  stages.
- **Files that exist on main**: hand-port only the hunks for the current step.
  Main has moved on since the branch point (YouTube embed, the euro coin post,
  the Organization schema, `sameAs`), so never overwrite a whole file.
- **Skip the branch's `index.html`/`404.html` schema change**
  (`["Organization", "LocalBusiness"]` + `areaServed`). Phase 2 replaces it.
- **Generated files** (`src/sitemap.xml`, `src/llms.txt`,
  `blog-content.generated.ts`): never port them. Regenerate them.

### Step 1.1 — Trailing-slash URLs (highest GSC impact)
- `src/app/trailing-slash-url-serializer.ts` (new), plus
  `{ provide: UrlSerializer, useClass: TrailingSlashUrlSerializer }` in
  `app.config.ts`.
- Make internal markdown links canonical:
  - In `scripts/auto-blog/internal-links.js`, take the `fixInternalLinks` regex
    change that skips images and file links. **Keep `SERVICE_FILE` pointing at
    `blog.service.ts`** until Step 1.8.
  - Port the `fixInternalLinks` pass in `scripts/generate-blog-content.js`.
  - Take the slash-terminated link edits in the `src/assets/blogs/*.md` files.
    Only the link hunks: the content edits belong to Step 1.7.
- `scripts/check-internal-links.js` (new), plus
  `"postbuild": "node scripts/check-internal-links.js"` in `package.json`.
- In the e2e URL assertions (`products.spec.ts`, `shell.spec.ts`,
  `smoke.spec.ts`, `routes.ts`), make the trailing slash optional with `/?`.
  `/products#id` becomes `/products/#id`.
- **Owner, after the deploy:** in GSC, resubmit the sitemap. Use URL Inspection
  → Request indexing for `/`, `/contact/`, `/prices/`, `/portfolio/`,
  `/products/` and `/blog/`, and run "Validate fix" on "Page with redirect".
  Also update the links in the Google listing's description to end in `/`.

### Step 1.2 — Crawlable call-to-action links on the homepage
- `main-page.component.html`: turn the 4 `<button igxButton (click)="navigateTo…()">`
  CTAs into `<a igxButton routerLink="/contact">` / `routerLink="/portfolio"`.
- Remove the now-unused `navigateTo…` methods, and port the spec changes.
- They should look the same. Confirm with screenshots: the visual baselines
  must not change. If anything looks different, ⛔ stop and show the owner.

### Step 1.3 — `/contact/` H1 banner + intro paragraph (user-facing) ⛔
- Port the `contact-me-page` html, scss, ts and spec hunks.
- **Check every claim in the intro against D4b** before showing it: replies
  within 24 h, city courier in Sofia, courier to the rest of Bulgaria, price by
  weight. Remove anything the owner hasn't confirmed.
- Take screenshots in light and dark, at desktop and mobile widths. ⛔ The owner
  approves them. This copy was never design-approved (Rule 2).

### Step 1.4 — `/portfolio/` intro + section captions (user-facing) ⛔
- Port the `portfolio-page` html, scss, ts and spec hunks.
- Take screenshots in light and dark, at desktop and mobile widths. ⛔ The owner
  approves them.

### Step 1.5 — Redirect stubs + fix the truncated slug
- `src/app/shared/legacy-redirect/legacy-redirect.component.ts` + `.spec.ts`
  (new) and `LEGACY_REDIRECTS.md` (new). GitHub Pages can't 301, so each old
  path becomes a prerendered stub that meta-refreshes to the new URL.
- Rename `prozrachen-i-poluprozrachen-pla-filament-kak-da-postignete-svetlopropuskliv-3d-p`
  to `prozrachen-i-poluprozrachen-pla-filament-svetlopropuskliv-3d-pechat`.
  That covers the markdown, the component folder and class, the cover `.webp`,
  its `blog.service.ts` entry, the route, `e2e/routes.ts`, and every internal
  link to it. Add a legacy route from the old path.
- Fix `slugify` truncation in `scripts/auto-blog/scrape-ideas.js` and add
  `scrape-ideas.test.js`. Add `"test:scripts": "node --test \"scripts/**/*.test.js\""`
  to `package.json`, and `- run: npm run test:scripts` to
  `.github/workflows/node.js.yml`.

### Step 1.6 — Merge the two money-making posts (content) ⛔
- Remove `how-to-make-money-with3d-printing` (component, `how-to-make-money.md`,
  `blog.service.ts` entry). Add a legacy route to
  `/blog/kak-da-pechelim-ot-3d-printiraneto/`.
- Take the branch's expanded `kak-da-pechelim-ot-3d-printiraneto.md`.
- Update `e2e/routes.ts` and any internal links to the removed post.
- ⛔ The owner reviews the merged article text.

### Step 1.7 — Content upgrades of two pillar posts (content) ⛔
- `3d-printing-in-sofia-for-your-project.md`: corrected heading levels, an
  „Пример 3“ budget table, and an FAQ section.
- `what-is-3d-printing.md`: trims.
- **Recheck every price against the live `/prices/` tiers**, and every service
  claim against D3 (FDM only).
- ⛔ The owner reviews the text.

### Step 1.8 — Blog registry refactor (one schema source per post)
- `src/app/services/blog-posts.registry.ts` + `.spec.ts` (new), the
  `blog-post.model.ts` fields (`seoTitle`, `dateModified`, `keywords`, …), and
  `SeoService.applyBlogPostSeo(slug)`, which emits one `BlogPosting` +
  `BreadcrumbList` `@graph` per post. Add its `seo.service.spec.ts` cases.
- Slim every blog component to the registry pattern.
- **Port the posts added on main after the branch point** into the registry: at
  least `monetna-karta-bulgarski-evro-moneti` and
  `3d-pechat-po-porachka-sofia-video`. Confirm by diffing the `id`s.
- Let `applyBlogPostSeo` take extra `@graph` nodes, so those posts keep their
  `VideoObject` (`videoObjectSchema` publishes it with
  `publisher: { '@id': …#organization }`).
- In `applyBlogPostSeo`, reference the brand by `@id` only:
  `{ '@id': 'https://3dpechat.bg/#organization' }`, without the hard-coded
  `'@type': 'Organization'` and `name`. Phase 2 changes the type to
  `LocalBusiness`.
- Point the scripts at the registry: `generate-llms.js`,
  `generate-blog-images.js`, `auto-blog/internal-links.js`,
  `auto-blog/preflight.js`, `auto-blog/index.js`,
  `auto-blog/scaffold-component.js` (slim component template). Also take the
  `AI_INSTRUCTIONS.md` notes.

### Step 1.9 — Honest sitemap `lastmod`
- Port `scripts/generate-sitemap.js`: a hand-maintained `MAIN_PAGE_LASTMOD` for
  the main pages, and `dateModified || date` from the registry for posts. This
  depends on Step 1.8.
- Set `MAIN_PAGE_LASTMOD` to the date each page's content really last changed,
  according to these steps' commits. **Never use the build date.**
- Phase 3 (IndexNow) depends on this step.

**Verify after every step:** `npm run build` (which runs the `postbuild` link
check from 1.1 on), `npm test -- --watch=false --browsers=ChromeHeadless`,
`npm run e2e`, and `npm run test:scripts` (from 1.5 on). Update visual
baselines with `npm run e2e:visual:update` only for pages that intentionally
changed.

**Implemented 2026-10-17 (one batch, awaiting the owner's review).**

How it was ported:
- Each file the branch changed and main didn't was taken from the branch
  (hash-verified).
- Each file both sides changed was 3-way merged with `git merge-file`, and the
  conflicts were resolved by hand.
- `index.html`/`404.html` schema hunks were skipped (Phase 2). Generated files
  were regenerated.

Deviations and additions to the steps above:
- **1.2:** the video section's „Заяви оферта“ (added on main) was also turned
  into a `routerLink` link, because the ported class no longer has
  `navigateToContact()`.
- **1.3:** the intro was rewritten to D2/D4b/D6: hours, address string, delivery
  by arrangement, Econt/Speedy. A „файлове по имейл или Viber“ note was added
  under the form.
- **1.7:** the Sofia post got the D4b lead times, rush terms, delivery and
  minimum order. „3D принтиране технологии“ now says PLA first, other materials
  on demand.
- **1.8:**
  - Posts 17 (`monetna-karta-…`) and 18 (`…-sofia-video`) are in the registry.
  - `applyBlogPostSeo(slug, extras)` takes extra `@graph` nodes, so those posts
    keep their FAQPage and VideoObject.
  - A shared `faqPageSchema()` helper was added for Phase 4.
  - The brand reference **keeps `'@type': 'Organization'` + `name`** (not
    `@id` only). Google's article guidelines want both, and a LocalBusiness is an
    Organization, so Phase 2 creates no conflict.
- **1.9:** `MAIN_PAGE_LASTMOD` was set to the real change dates.
- **Extra (D3/D4):**
  - a 3 € minimum in the prices calculator, with unit and e2e tests
  - „3D сканиране“, „ABS печат“ and „PETG печат“ removed from the meta keywords
  - ABS/PETG removed from the prices page keywords
  - the llms.txt summary changed to FDM/PLA
- **Agent instructions (added the same day, on the owner's request):**
  - `CLAUDE.md` **Rule 5** covers business facts, the blog registry and its
    trade-offs, hand-maintained dates, trailing slashes and legacy redirects.
  - `AI_INSTRUCTIONS.md`, `ARTICLE_CREATION_GUIDE.md`, `SEO_GUIDE.md`, the
    `add-product` skill and `src/data/README.md` were updated to match.
  - The auto-blog prompt embeds `business.json` `facts`/`neverClaim`, guarded by
    `generate-article.test.js`.
  - A prices spec ties the calculator minimum to the `business.json` fact.
- **Not done:**
  - Visual baselines were not regenerated. They are Linux-rendered in CI, so
    after pushing, run the "visual" workflow with `update_baselines` for home,
    contact, portfolio and prices.

Verified: `npm run build` (26 routes prerendered, link check clean), Karma
143/143, `npm run test:scripts` 6/6, Playwright functional 106/106. Review
screenshots were taken in light and dark, at desktop and mobile widths.

**Done when:** steps 1.1–1.9 are reviewed and committed by the owner and
deployed. View-source on the live site must show nav, footer and blog-card
hrefs ending in `/`, both old slugs must redirect, and GSC "Validate fix" must
have started.

---

## Phase 2 — One business identity + `LocalBusiness` schema

Same branch (`discoverability-ai-improvements`), after Phase 1 is reviewed and
committed.

**Why:** an assistant links the listing and the site to one business only when
name, address and phone match. Today four names and two address forms are in
circulation.

> ✅ **2.1 data done early (2026-10-17):** `src/data/business.json` exists with
> every value below plus `facts` and `neverClaim` (the copy rules), and the
> auto-blog prompt already reads it. Phase 2 only has to **wire** it into the
> JSON-LD, the footer, the contact intro and llms.txt (2.2–2.5).

**2.1 Single source of truth: `src/data/business.json`** (Rule 4)
```jsonc
{
  "name": "3dpechat",
  "alternateName": ["3dpechat.bg", "3D Печат България"],
  "url": "https://3dpechat.bg/",
  "telephone": "+359883310616",
  "email": "3dpechat.bg@gmail.com",
  "logo": "https://3dpechat.bg/assets/logo.png",
  "image": "https://3dpechat.bg/assets/og-image.png",
  "address": {
    "streetAddress": "бул. „Симеоновско шосе“ 110 б, ет. 2",
    "addressLocality": "София",
    "postalCode": "1700",
    "addressRegion": "София-град",
    "addressCountry": "BG"
  },
  "displayAddress": "кв. Витоша, бул. „Симеоновско шосе“ 110 б, ет. 2, 1700 София",
  "geo": { "latitude": 42.640588, "longitude": 23.3342435 },
  "hasMap": "https://www.google.com/maps?cid=9860284859046039627",
  "openingHours": [
    { "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], "opens": "09:00", "closes": "18:00" }
  ],
  "priceRange": "<D4a>",
  "areaServed": ["София", "България"],
  "technologies": ["FDM"],
  "services": ["3D печат по поръчка", "Прототипи", "Функционални детайли и резервни части", "Малки серии", "Персонализирани подаръци", "3D моделиране по идея"],
  "sameAs": [
    "https://www.instagram.com/3dpechat.bg",
    "https://www.tiktok.com/@3dpechat.bg",
    "https://www.youtube.com/@3dpechatbg",
    "https://makerworld.com/en/@zdkolev"
  ]
}
```
Trim `services` to what the owner confirms. `generate-llms.js` has its own
`PROFILES` list: make it read `sameAs` from this file so the two can't drift.

**2.2 Generator: `scripts/generate-business-schema.js`**, added to `prebuild`
before `generate-llms`.
- Build the JSON-LD from `business.json`, then rewrite the
  `<script type="application/ld+json" id="organization-jsonld">…</script>`
  block **in both `src/index.html` and `src/404.html`**. With one generator,
  the two files can't drift.
- Use Node `fs` with UTF-8 and no BOM.
- It must be idempotent, and it must exit non-zero if the block isn't found.
- Output shape:
  - `"@type": "LocalBusiness"`
  - keep `"@id": "https://3dpechat.bg/#organization"`
  - `name`, `alternateName`, `url`, `logo`, `image`, `telephone`, `email`
  - `address` (`PostalAddress`)
  - `geo` (`GeoCoordinates`)
  - `hasMap`
  - `openingHoursSpecification`: Monday–Sunday, 09:00–18:00 (D2)
  - `priceRange`
  - `areaServed`: `[{ "@type": "City", "name": "София" }, { "@type": "Country", "name": "България" }]`
  - `makesOffer`: one `Offer` → `itemOffered: { "@type": "Service", "name": … }`
    per service
  - `knowsAbout`: the technologies
  - `sameAs`
- **Never** emit `aggregateRating` or `review`.
- Update the comment above the block to say it is generated (don't hand-edit),
  and add a note to [`AI_INSTRUCTIONS.md`](AI_INSTRUCTIONS.md).

**2.3 Use the canonical name everywhere**
- `SeoService.siteName` (`seo.service.ts`).
- The header title „3D Печат услуги“ (`app.component.html:13`, `.full-text`).
  It's a visible brand string, so confirm the display form with the owner. The
  logo may legitimately read differently from the entity `name`.
- The contact intro address (`contact-me-page.component.html`) should come from
  `business.json.displayAddress`, like the footer.
- The static `og:site_name` in `src/index.html` and `src/404.html`. Either let
  the generator replace it too, or edit both by hand and cover them with the
  test in 2.5.
- `generate-llms.js`: H1 and summary from `business.json`.
  - **Replace „FDM, SLA и SLS печат“ with FDM only (D3).**
  - Keep the „бърза доставка в София и цялата страна“ claim only if D4b confirms
    delivery across the country.
  - Add a short `## Факти` section with address, phone, hours, service area and
    delivery, price basis, services and technologies, one line each.
- **Remove „3D сканиране“** from the meta keywords in `src/index.html` and
  `src/404.html` (D3: there's no scanning service).
- If Step 1.8 landed, `applyBlogPostSeo` already references the brand by `@id`
  only. Check that no other schema hard-codes
  `{ '@type': 'Organization', name: … }` for the brand
  (`grep -rn "'Organization'" src/app`).

**2.4 Visible address**
- The footer (`app.component.html` ~L251) and the contact page show
  `business.json.displayAddress`, imported at build time like `products.json`.
- This is a copy-only change with the string approved in D6, so no design
  artifact is needed.
- Make the phone and address text identical to the schema.

**2.5 Tests**
- `e2e/seo.spec.ts`:
  - Update the Organization test: `@type` is `LocalBusiness`, `name` equals
    `business.json.name`, plus `telephone`, `address.postalCode === '1700'`,
    `geo`, and `sameAs` containing every profile.
  - **New:** no JSON-LD on any route in `e2e/routes.ts` contains
    `aggregateRating` or `review` anywhere, checked recursively.
  - **New:** the `organization-jsonld` content of `/404.html` deep-equals that
    of `/`.
- `scripts/generate-business-schema.test.js` (run by `npm run test:scripts`):
  the block is replaced, a second run produces no diff, the output has no rating
  keys, and a missing block fails.
- `app.component.spec.ts`: the footer renders `displayAddress`.

**2.6 Optional:** add a square logo of 100 KB or less (at least 112×112 px) for
schema `logo`. `assets/logo.png` is 1.4 MB.

**Verify:** run the CLAUDE.md commands plus `npm run e2e` and
`npm run test:scripts`. After the deploy, check `https://3dpechat.bg/` in
<https://validator.schema.org/> and in Google's Rich Results Test, with zero
errors.

**Owner:** bring the Google Business Profile in line with `business.json`: same
hours, website `https://3dpechat.bg/`, phone, the most specific 3D-printing
primary category, a description, the services list, and 10+ real photos of work
and the workshop. **Don't add keywords to the GBP name.** It breaks Google's
guidelines and risks suspension.

**Implemented 2026-10-17 (uncommitted, awaiting review):**
- `scripts/generate-business-schema.js` (+ test, in prebuild) writes the
  `LocalBusiness` block and `og:site_name` into both HTML files, and refuses
  review/rating keys.
- `og:site_name` and the schema publisher/author are now „3dpechat“. **Title
  suffixes stay „3D Печат България“** (`business.json.titleBrand`), so no page
  title changes.
- llms.txt is generated from `business.json`: H1, summary, a new `## Факти`
  section and profiles from `sameAs`. The Prices description was corrected to
  "по грамаж".
- The footer address and the contact intro's address and hours come from
  `business.json` through `src/data/business.ts` (`openingHoursLabel()`).
- `areaServed` is structured (`{type, name}`), and `titleBrand` was added.
- **Tests:**
  - e2e: LocalBusiness matches `business.json`, `404.html` schema matches
    home, no review markup on any route, and llms.txt carries the facts.
  - Karma: footer address, contact intro, `business.ts`.
- **Not done (owner):**
  - 2.6, the small square logo.
  - The header title „3D Печат услуги“, a visible brand string to decide on.
  - The GBP updates.
  - The validators after deploy.

**Done when:** the owner has reviewed and committed the changes, they're
deployed, the validators are clean, and the GBP is updated.

---

## Phase 3 — Bing presence + IndexNow

**Why:** ChatGPT's local answers start from a Bing search. IndexNow gets new
posts and products into Bing (and Yandex, Seznam, Naver) within hours instead
of weeks. Google doesn't use IndexNow, and that's fine.

**Owner (no code, ~30 min), can be done any time:**
- [ ] Bing Webmaster Tools → **Import from Google Search Console**. This
  verifies the site with no code. Then submit `https://3dpechat.bg/sitemap.xml`.
- [ ] Bing Places for Business → **import from Google Business Profile**, then
  check that name, address, phone and hours match `business.json`.
- [ ] Apple Business Connect → claim the place (Apple Maps, Siri).
- [ ] Optional: Foursquare, plus an OpenStreetMap node with the same name,
  address and phone. Many map apps use OSM data.
- If the GSC import fails, the owner downloads `BingSiteAuth.xml`, and the agent
  adds it to `public/`.

**Agent** (this depends on Step 1.9's honest `lastmod`; otherwise every deploy
resubmits every URL):
- **3.1 Key file.** Generate a 32-character hex key and add `public/<key>.txt`
  containing only the key. `public/` is copied to the site
  root, like `CNAME`. After the deploy, `https://3dpechat.bg/<key>.txt` must
  return the key.
- **3.2 `scripts/indexnow.js`**
  - Arguments: `--sitemap <built sitemap>`, `--prev <previous sitemap>`
    (optional), `--all`.
  - Export a pure function `changedUrls(prevXml, nextXml)` that returns the URLs
    that are new or whose `<lastmod>` changed.
  - POST to `https://api.indexnow.org/indexnow` with
    `{ host: "3dpechat.bg", key, keyLocation: "https://3dpechat.bg/<key>.txt", urlList }`.
  - Log the HTTP status; 200 or 202 is success.
  - **Always exit 0**, so IndexNow can never break a deploy.
  - Tests go in `scripts/indexnow.test.js`.
- **3.3 `github-pages.yml`**
  - Before the deploy step:
    `curl -fsS https://3dpechat.bg/sitemap.xml -o "$RUNNER_TEMP/prev-sitemap.xml" || true`.
  - After `deploy-pages`: run
    `node scripts/indexnow.js --sitemap ./dist/${{ env.PROJECT_NAME }}/browser/sitemap.xml --prev "$RUNNER_TEMP/prev-sitemap.xml"`
    with `continue-on-error: true`.
  - Add a `workflow_dispatch` boolean input `indexnow_all` that passes `--all`.
    The owner uses it once after the first deploy.

**Implemented 2026-10-17 (uncommitted, awaiting review):**
- Key file `public/889d7f7784930214bdb308e7e3458e37.txt`. `angular.json` now
  copies `public/*.txt` to the site root; before this, only `CNAME` was copied.
- `scripts/indexnow.js` (+ 7 tests):
  - It also takes `--dry-run`.
  - It checks the key file is live before posting, and always exits 0.
  - `npm run indexnow` runs it.
- `github-pages.yml`:
  - saves the live sitemap before deploying
  - runs the "Notify IndexNow" step after `deploy-pages` with
    `continue-on-error`
  - has a `workflow_dispatch` input, `indexnow_all`
- An e2e test checks that the key file is served.
- A dry run against the live sitemap found no changed URLs. Phase 1 is
  already live and Phase 2 changes no `<lastmod>`. So after deploying Phase 2,
  **run the deploy workflow once with `indexnow_all`**, so Bing re-crawls every
  page with the new schema.

**Done when:** the first run logs 200/202, and Bing Webmaster Tools → IndexNow
shows the URLs as received.

---

## Phase 4 — Answer-ready content (user-facing, so design comes first) ⛔

**Why:** assistants quote concrete, self-contained sentences. Today the buyer
facts (lead time, delivery, files, minimums) are scattered across pages or
missing.

**4.1 Design artifact (Rule 2).**
- Show 2–4 branded variants of a „Често задавани въпроси“ / „Как да поръчам“
  section, plus visible opening hours (D2: every day, 9:00–18:00) on
  `/contact/`.
- Show light and dark, and mark the recommended variant.
- Variants to cover:
  - **A (recommended):** always-visible Q&A as an `igx-card` grid on `/prices/`.
    Every answer is in the prerendered HTML and no exclusion needs lifting.
  - **B:** an `igx-expansion-panel` accordion. This means removing it from
    `$exclude-components`; note the CSS cost against the Lighthouse budget.
  - **C:** the FAQ on `/contact/` under the form.
- Record the artifact URL and the chosen variant in the artifacts table in
  [`FEATURE-IDEAS-PLAN.md`](FEATURE-IDEAS-PLAN.md).

⛔ **STOP for approval.**

**4.2 Build the approved variant**
- Content goes in `src/data/faq.json` (Rule 4). **Facts come only from D4b**,
  which must be answered before 4.2 starts. Never invent a price, a time or a
  size.
- Write 6–10 questions. Each answer is 1–3 sentences, opens with the direct
  answer and includes the number. Suggested questions:
  - Колко време отнема една поръчка?
  - Мога ли да поръчам без готов 3D модел – само по идея, снимка или скица?
  - Какви файлове приемате?
  - Как се изчислява цената? Има ли минимална поръчка?
  - Какви материали и цветове предлагате?
  - Правите ли малки серии и поръчки за фирми (с фактура)?
  - Как получавам поръчката – доставяте ли извън София?
  - Какъв е максималният размер на детайл?
- Add `FAQPage` JSON-LD built from `faq.json` via `setStructuredData`, combined
  in an `@graph` with whatever schema the page already has. Since 2023, Google
  shows FAQ rich results only for government and health sites. The markup is
  for other parsers and does no harm.
- Use Ignite components only, each listed in the standalone `imports`. The spec
  asserts the Ignite tags, checks that every `faq.json` entry renders, and checks
  that the JSON-LD matches `faq.json`.
- `generate-llms.js`: add the FAQ page URL and 3–4 key facts under `## Факти`.
- Verify with the CLAUDE.md commands plus `npm run e2e`, and take screenshots in
  light and dark at desktop and mobile widths.

**4.3 Content backlog for buyer-intent questions** (ongoing, through the
auto-blog pipeline or by hand)
- Before writing each one, check it doesn't compete with an existing post (the
  two money posts already had to be merged).
- Link each one to `/prices/` and `/contact/` with trailing slashes.
- Topics:
  - „Колко струва 3D печат? Примерни цени на реални поръчки“: real portfolio
    examples, grams × price, using owner-supplied numbers only.
  - „Резервна част с 3D печат, когато детайлът вече не се произвежда“
  - „3D печат по идея или снимка: как работи 3D моделирането по поръчка“
  - „3D печат за фирми: прототипи и малки серии в София“

**Implemented 2026-10-17 (uncommitted).** The agent picked the variant; the
owner asked it to decide.
- **4.1:** the [design canvas](https://claude.ai/artifact/G9ZMwauxMhKhvngFyvZ4W7)
  shows FAQ A/B/C, recorded in `FEATURE-IDEAS-PLAN.md`. **A** was built. The
  owner had already added visible hours and address to `/contact/` (commit
  `91bbcc1`).
- **4.2:**
  - `src/data/faq.json` has 10 Q&A.
  - `app-faq` (`src/app/shared/faq/`) renders them as always-visible
    `igx-card`s on `/prices/`, with FAQPage JSON-LD via `faqPageSchema(FAQ)`.
  - llms.txt gets a „Често задавани въпроси“ section.
  - `faq.spec.ts` is the facts guard.
  - The calculator minimum now reads `business.json`.
- **4.3:** `scripts/auto-blog/service-topics.js` queues 4 buyer-intent topics:
  spare part, modeling from a photo, price per gram, file formats. Each has a
  fixed slug. The pipeline (1st/11th/21st of the month) takes them first and
  opens each post as a PR for review. The B2B topic was dropped because no
  invoices are issued.

**Done when:** the FAQ is live, the validators are clean, and at least one
backlog post is published.

---

## Phase 5 — English landing page `/en/` (only if D5 is yes; design first) ⛔

**Implemented 2026-10-17 (uncommitted).** Variant A was picked by the agent.
- `src/app/en-page/` has Ignite cards, avatars and button links. Every number
  comes from new structured `business.json` fields.
- `SeoService.updateSeo({ locale, alternates })` sets `<html lang>`,
  `og:locale` and hreflang. `HOME_LANGUAGE_ALTERNATES` is used on `/` and
  `/en/`; every other page resets to Bulgarian with no hreflang.
- The footer gets an „English“ link. Sitemap, llms.txt, e2e routes, the a11y
  scan and SEO tests were added.
- ⚠ The copy says "Write to us in English": the owner must confirm English
  inquiries are answered.

**Why:** English questions ("3D printing service Sofia") from expats and foreign
companies have nothing on the site to match.

- Build **one page, not full i18n.** Don't revive the `add-localization` branch:
  it is 203 commits behind main.
- The design artifact shows 2–3 variants. ⛔ **STOP for approval.**
- Then implement:
  - an `en` route in `app.routes.ts`, prerendered (check `app.routes.server.ts`)
  - a standalone component with Ignite components only, and a spec with the
    Ignite-tag assertion
  - copy that the owner approves
  - `<html lang="en">` for that route, set via `DOCUMENT` in `SeoService` so it
    applies during prerender
  - `og:locale` `en_US`
  - `<link rel="alternate" hreflang>` on both `/` and `/en/`: `bg` → `/`,
    `en` → `/en/`, `x-default` → `/`
  - a sitemap entry (main pages in `generate-sitemap.js`, with
    `MAIN_PAGE_LASTMOD`) and an llms.txt entry
  - the route added to `e2e/routes.ts`, plus an SEO test for `lang` and hreflang
- Finish with `npm run generate-sitemap` and the full verification.

---

## Phase 6 — Off-site presence (owner-led; the agent drafts, never sends or posts)

**Why:** in BrightLocal's study of ChatGPT local answers, business websites are
58% of sources, mentions on other sites 27% and directories 15%. We currently
have only the website share.

Checklist for the owner. The agent prepares the drafts and the submission sheet
and hands them over **without committing them**.

- [ ] Every profile links to `https://3dpechat.bg/` under the canonical name:
  YouTube About and **every** video description, Instagram and TikTok bios, the
  MakerWorld profile and each model's description.
- [x] ~~A Facebook business page~~: **not for now** (owner, 2026-10-17). If one
  is created later, use identical name, address and phone, and add it to
  `business.json.sameAs`.
- [ ] Established Bulgarian business directories (for example Златни страници /
  goldenpages.bg, plus 2–3 others), with identical name, address and phone. No
  paid link farms. The agent generates a submission sheet from `business.json`:
  name, address, phone, hours, a BG and EN description, categories, photos.
- [ ] Pitches to local press and blogs. The agent drafts two Bulgarian emails:
  - (a) the euro coin card („Монетна карта за българските евромонети“). It's
    timely, since Bulgaria adopted the euro on 2026-01-01.
  - (b) the family story („3D принтер за начинаещи: от детско хоби в семеен
    проект“).

  The owner sends them.
- [ ] Maker communities (Bulgarian 3D-printing Facebook groups and forums):
  give helpful answers, and link only when relevant.
- [ ] Partners that would link back: maker spaces, schools, hobby and Warhammer
  clubs (there's already a Warhammer post), local shops.
- [ ] Reviews: close the gap. We have **15**; the competitors Google shows next
  to us have **35** and **53** (2026-10-17). Ask every customer, and put a QR
  card in each package that links to `GOOGLE_REVIEW_URL`. The card is
  customer-facing, so it needs a design artifact first. Reply to every review.
  **Never incentivize or fake reviews.**

**Prepared 2026-10-17.** The off-site kit was handed to the owner outside the
repo; it's the agent's session scratchpad, so copy it somewhere permanent. It
contains:
- **Listing sheet:** canonical name, address, phone and hours, BG/EN short and
  long descriptions (no URLs in the GBP description), services, and photo
  notes. Google wants JPG/PNG; the repo's photos are WebP.
- **Priority list:** Google → Bing Places → **Golden Pages** (Google's
  attribution page names goldenpages.bg as a source of its Bulgarian listing
  data) → Apple → Facebook → Foursquare → OSM.
- **Two pitches:** (a) the euro coin card. (b) **StandStrap**, replacing the
  family story: that post was auto-generated and its „Мартин“ is probably not
  real, so it can't be pitched.
- **Review-request templates:** Viber, email and in person, with no gating and
  no incentives.
- **Profile texts:** a GBP post with slash links, Instagram, TikTok, YouTube
  About plus a video footer, and MakerWorld.
- **Review card:** variant A on the design canvas. Make the QR code in Chrome
  (Share → Create QR code).

---

## Phase 7 — Monitoring (set up in Phase 0, then repeat monthly)

**Implemented 2026-10-17:**
- `scripts/check-live-site.js` (`npm run check:live`, +5 tests) is a read-only
  production check:
  - 8 crawler user agents get the full page
  - the schema matches `business.json`, and `404.html` matches home
  - every sitemap URL returns 200, is self-canonical, has canonical links and
    no review markup
  - slash-less URLs 301, and legacy redirects work
  - llms.txt has every fact, and the IndexNow key is served
  - the address and minimum-order copy are right, and the FAQ and `/en/` are
    present (once deployed)
- `.github/workflows/live-site-check.yml` runs it every Monday at 06:00 UTC and
  on demand.
- The GA4 channel group and the prompt panel stay owner tasks.

- **GA4**: Explore → Session source / medium, filtered by the regex
  `chatgpt|openai|perplexity|gemini|copilot|claude|bing`. ChatGPT appends
  `utm_source=chatgpt.com` to the links it cites. Add a custom channel group
  "AI assistants" to see the trend.
- **Prompt panel**: same wording every month. Use ChatGPT (with search),
  Perplexity, Gemini, Copilot and Google AI Mode, in a private window, and note
  where the device is located.
  1. Къде мога да поръчам 3D печат в София?
  2. Фирма за 3D принтиране по поръчка в София
  3. Изработка на резервна част с 3D принтер
  4. 3D печат на подарък по снимка
  5. Колко струва 3D печат в България?
  6. 3D printing service in Sofia
  7. Custom 3D printing small batch Bulgaria
- Log each run in the **Monitoring log** below: listed or not, position, the URL
  cited, and whether the description is accurate. A wrong fact in an answer
  (SLA, hours, prices) means a source needs fixing.
- **GSC and Bing Webmaster Tools**: compare indexed URLs to sitemap URLs. The
  target is all of them.
- **Limitation:** GitHub Pages gives no server logs, so AI crawler visits can't
  be observed directly. Referral traffic and the prompt panel are the proxies.

---

## Guardrails (every phase)

- **Never commit, stage, push or open a PR.** Leave changes in the working tree
  on `discoverability-ai-improvements`; the owner reviews and commits.
- Keep `robots.txt` allowing everything. If a CDN or WAF is ever put in front,
  allowlist `Googlebot`, `Bingbot`, `OAI-SearchBot`, `ChatGPT-User`,
  `PerplexityBot`, `Perplexity-User`, `ClaudeBot`, `Claude-SearchBot`,
  `Claude-User` and `Applebot`. Cloudflare now blocks AI crawlers by default.
- Keep the prerender and the build-time data imports (Rule 4). Never move
  content to a runtime fetch.
- No `Review`/`AggregateRating` schema. No fake or incentivized reviews. No
  keywords in the GBP name. No thin doorway pages per neighborhood or city.
- Every fact in the schema, FAQ or llms.txt comes from the owner. Never invent
  one.
- Don't hand-edit `src/llms.txt`, `src/sitemap.xml` or the generated JSON-LD
  block. Change the generator or its JSON source.
- One URL form everywhere: trailing slash, in new content too.
- Each phase's verification:
  - `npm run build`
  - `npm test -- --watch=false --browsers=ChromeHeadless`
  - `npm run e2e`
  - `npm run test:scripts` (once Step 1.5 adds it)
  - for user-facing changes, Playwright screenshots in light and dark, at
    desktop and mobile widths

  Report failures with their output.

---

## Decisions log

| # | Decision | Answer | Date |
|---|----------|--------|------|
| D1 | Canonical business name | `3dpechat` (alternateName „3dpechat.bg“, „3D Печат България“). The Google listing name stays as it is. | 2026-10-17 |
| D2 | Opening hours | Every day, 9:00–18:00, matching the Google listing. No „по предварителна уговорка“. | 2026-10-17 |
| D3 | Technologies offered | FDM only. No SLA, SLS or 3D scanning. | 2026-10-17 |
| D4a | `priceRange` | `€` (0.80–1.50 € per 10 g; 3 € minimum order) | 2026-10-17 |
| D4b | FAQ facts | See Phase 0 „D4b: the owner's answers“. All confirmed: free initial offer with modeling priced by complexity/time (no figure), free delivery over 100 € in all of Bulgaria, replies in Bulgarian and English | 2026-10-17 |
| — | Phase 1 delivery | Implement Steps 1.1–1.9 at once and review them together | 2026-10-17 |
| D5 | English `/en/` page | Yes, in Phase 5 | 2026-10-17 |
| D6 | Display address string | „кв. Витоша, бул. „Симеоновско шосе“ 110 б, ет. 2, 1700 София“ | 2026-10-17 |
| — | `zkolev/seo-fixes` | Don't merge wholesale; port step by step (Phase 1, Steps 1.1–1.9) | 2026-10-17 |
| — | Workflow | All work on `discoverability-ai-improvements`; the agent never commits; the owner reviews and commits | 2026-10-17 |
| — | Baseline prompt panel | The owner runs it and shares the results | 2026-10-17 |
| A1 (agent) | Variants for Phases 4–6 | FAQ A (cards on /prices/), /en/ A (full landing), review card A (85×55 mm); [canvas](https://claude.ai/artifact/G9ZMwauxMhKhvngFyvZ4W7) | 2026-10-17 |
| A2 | 3D modeling wording | **Owner:** the initial offer is free; the modeling price depends on complexity (time spent) and comes with the offer. No price figure anywhere. Updated in facts, `neverClaim`, the FAQ, `/en/`, the topic queue and the canvas | 2026-10-17 |
| A3 | Free delivery over 100 € | ~~Sofia only (agent)~~ → **all of Bulgaria** (owner). `freeDeliveryOverEur`; copy updated in business.json facts, the FAQ, `/en/`, the contact Доставка card and the Sofia blog post | 2026-10-17 |
| A4 | Invoices in the FAQ / `/en/` | Stated honestly: „Към момента не издаваме фактури“ / "We don't issue invoices at the moment". **Confirmed by the owner** | 2026-10-17 |
| A5 | Header / footer / YouTube name „3D Печат Услуги“ | Visible text unchanged; added to `alternateName` so machines see one entity. **Confirmed by the owner (keep)** | 2026-10-17 |
| A6 (agent) | Schema logo | `assets/logo-512.png` (70.5 KB, from the 1631 px logo) | 2026-10-17 |
| A7 | `/en/` reply language | **Owner: yes, English inquiries are answered.** Now a `business.json` fact, `languages: ["bg","en"]`, and `knowsLanguage` in the schema | 2026-10-17 |
| A8 (agent) | Buyer-intent posts | Queued 4 topics for the auto-blog pipeline instead of hand-writing; dropped the B2B topic (no invoices) | 2026-10-17 |
| A9 (agent) | Second press pitch | StandStrap instead of the auto-generated „Мартин“ family story | 2026-10-17 |
| O1 (owner) | „Мартин“ post | **Removed.** Its URL is a legacy redirect to `/blog/barzi-i-umni-3d-printeri/` (closest live topic), recorded in `LEGACY_REDIRECTS.md`. The A1 Combo post's link to it now points to `/blog/what-is-3d-printing/`. IndexNow now also submits removed URLs, so Bing re-crawls the old one | 2026-10-17 |
| O2 (owner) | Facebook page | Not for now | 2026-10-17 |
| O3 (owner) | Invented examples in „3D принтиране в София“ | **Removed** the „реални бизнеси“ section: the architecture-studio and electronics-startup stories. The price-per-gram calculation stays, reworded as an explicit hypothetical („Колко струва малка серия? Примерно изчисление“) | 2026-10-17 |
| O4 (owner) | StandStrap press pitch | Confirmed as written (the owner snowboards) | 2026-10-17 |
| A10 (agent) | Page titles | Unchanged („… \| 3D Печат България“ via `titleBrand`); only the entity name is „3dpechat“ | 2026-10-17 |

## Monitoring log

| Date | Assistant | Prompt | Listed? | Position | Cited URL | Notes |
|------|-----------|--------|---------|----------|-----------|-------|
| 2026-10-16 | ChatGPT (iOS, Instant) | ≈ „фирми в София за изработка по поръчка“ (3D) | yes | 1 | 3dpechat.bg | Card from the business listing („3dpechat“, Kv. Vitosha, 1700); blurb paraphrases the homepage |

## Sources

- [Search Engine Land: How ChatGPT conducts local searches](https://searchengineland.com/how-does-chatgpt-conduct-local-searches-454894)
- [Local Falcon: ChatGPT local search data sources](https://www.localfalcon.com/blog/chatgpt-local-search-data-sources-where-does-business-info-come-from)
- [BrightLocal: Uncovering ChatGPT search sources](https://www.brightlocal.com/research/uncovering-chatgpt-search-sources/)
- [IndexNow protocol](https://www.indexnow.org/documentation)
