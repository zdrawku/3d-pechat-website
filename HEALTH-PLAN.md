# Repo Health Plan — security, CI, content integrity, code health

> Drafted 2026-10-25 by Claude (Opus 5.5) from a read-only audit: four parallel
> reviews (automation security; build, tests and dependencies; architecture and
> code quality; SEO and single sources of truth) plus read-backs of the repo
> settings through `gh api`.
>
> **Status (2026-10-25):** the GitHub settings in §0 are ✅ done and verified
> through the API, apart from the items still listed there. `SECURITY.md`,
> `dependabot.yml`, §1.5 (Angular 21.2.25) and §1.6 (CodeQL) are merged
> (`21cecc5`, live; Node.js CI, E2E and Deploy green); §1.3 and the last
> CodeQL fix are merged (`555344b`). §1.2 is done in the working tree,
> uncommitted, and needs the `SHORTS_STATE_KEY` secret (see §1.2).
> Everything else in §1–§3 is ⬜ open.
>
> **Baseline at audit time (`d58e952`):** `npm run build` ✅ (44 routes),
> `npm run lint` ✅, `npm run test:scripts` ✅ 142/142, `npm test` ❌ 348/350,
> `npm run check:live` ✅ 66/66.

**How to use this plan:** one small PR per item, then tick the item here with
the PR number. Items marked 🔒 harden the automation; do them before anything
that increases the amount of automatically generated content.

---

## 0. GitHub settings

### ✅ Done 2026-10-25 (verified via `gh api`)

| Setting | State |
|---|---|
| Ruleset `main`, bypass list | Only the repository admin role. The four GitHub Apps (`claude`, `gemini-code-assist`, `copilot-swe-agent`, unidentified id 946600) are removed. |
| Collaborators | `zdrawku` (admin) only. |
| Environment `claude` | Holds `CLAUDE_CODE_OAUTH_TOKEN`; deployable from `main` only. No repo-level secrets. |
| Environment `copilot` | Deleted (never used: no Copilot PRs, no deployments). |
| Private vulnerability reporting | Enabled. |
| Dependabot alerts / security updates / grouping | Enabled. |
| CodeQL default setup | `actions` + `javascript-typescript`, weekly. First run: 3 alerts, see §1.6. |
| Secret scanning + push protection | Enabled. |
| Fork PR workflow approval | All external contributors. |
| Default workflow token | Read. |
| `make-short-transcript-*` artifacts | The four leftovers from 2026-10-24 deleted. Since `485f648` the transcript is uploaded only when the repo variable `SHORTS_DEBUG` is `true`, and kept 3 days. |

Keep **"Allow GitHub Actions to create and approve pull requests"** on
(Settings → Actions → General → Workflow permissions): add-product, auto-blog
and visual open their PRs with it. The required code-owner review still keeps
every merge with the owner.

### ⬜ Still open

- [x] **`SECURITY.md` is GitHub's unedited template** (`c069415`: a
  5.1.x/4.0.x version table and placeholder text). Replaced in the working
  tree (2026-10-25) with this policy:

  ```markdown
  # Security Policy

  This repository is the source of https://3dpechat.bg and the GitHub Actions
  that publish its content. There are no released versions — only the live
  site (`main`) is supported.

  ## Reporting a vulnerability

  Please **do not open a public issue.** Report it privately via
  **Security → Report a vulnerability** on this repository.

  Include what is affected (the site, a workflow, the issue forms), steps to
  reproduce, and the impact. We are a two-person team; expect a first reply
  within 7 days. There is no bug bounty.

  **In scope:** the website, the workflows and scripts in this repo.
  **Out of scope:** third-party services (GitHub, Google, Anthropic), social
  engineering, denial of service.
  ```
- [x] **`.github/dependabot.yml` for GitHub Actions only** (monthly, one
  grouped PR). Not for npm: Angular majors go through `ng update`. Added in
  the working tree (2026-10-25).
  ```yaml
  version: 2
  updates:
    - package-ecosystem: github-actions
      directory: /
      schedule:
        interval: monthly
      groups:
        actions:
          patterns: ["*"]
  ```
- [ ] **Uninstall unused GitHub Apps** (https://github.com/settings/installations):
  Claude, Gemini Code Assist, Copilot, and whatever id 946600 is. The current
  `gh` token can't read installations, so check this by hand.
- [ ] **Close the stale auto-blog PRs** #32, #33, #34, #35, #37, #38. They all
  conflict with `main` (old component layout) and repeat topics (zits-i-blobs
  ×3, vidove-filament ×2).
- [ ] *(optional)* Settings → Actions → General → Artifact and log retention:
  90 → 14 days, so a future upload step without `retention-days` doesn't
  linger. Today's workflows already set 14 days (reports) and 3 days
  (transcripts).
- [ ] *After §2.3:* "Require actions to be pinned to a full-length commit SHA",
  and allow only GitHub-owned actions plus `peter-evans/create-pull-request`.
- [ ] *After §2.1 is green:* ruleset `main` → "Require status checks to pass"
  (Node.js CI build + unit tests, E2E).

---

## 1. 🔴 Now — small effort, high impact

- [ ] **1.1 PR #51 (`rezervna-chast-s-3d-pechat`): edit before merging.** The
  Bulgarian text and its English draft
  (`3d-printed-replacement-parts-order-guide.md`) contain:
  - „в рамките на София получавате детайла в същия ден след готовност“ —
    same-day is in `neverClaim`;
  - „Ето няколко типични случая, които сме обработвали“ plus five customer
    cases — almost certainly invented;
  - „общата цена често е между 5 € и 15 €“ — not a fact;
  - „можете да дойдете в офиса“ — check against `business.json` facts.

  This is the post AI assistants would quote for „резервна част 3D печат“.
- [x] **1.2 🔒 make-short: trust only verified saved state** (`scripts/make-short/from-issue.js:96-103`, `:196-203`).
  Done in the working tree 2026-10-25, as described below:
  - The record (issue number, the agent's message, video yes/no, state) is
    HMAC-signed with `SHORTS_STATE_KEY`. Only the prepare and publish steps
    get the key, never the agent's.
  - The agent sees the bot's replies only through the signed message.
  - Flow names are plain file names (`[A-Za-z0-9][A-Za-z0-9_-]{0,39}`) and
    every write stays inside `previous/flows`.
  - make-short downloads attachments without a token too.
  - **Owner:** add the secret `SHORTS_STATE_KEY` (64 hex chars) to the
    `claude` environment. Without it the pipeline still works, but every
    round starts afresh. Issues opened before this change also start afresh
    once, because their old state is unsigned.
  - Guards: `lib.test.js`, `from-issue.test.js`, `issue-workflows.test.js`.

  The plan as first written:
  - Accept flow names only if they match `^[a-z0-9-]{1,40}$`, and check that
    every resolved write path stays inside `$WORK/previous`.
  - Sign the state with an HMAC key kept in the `claude` environment: sign
    in `publish`, verify in `prepare`. Ignore unsigned bot comments.
  - Feed the agent the verified state only, not the text of earlier bot
    comments.
- [x] **1.3 🔒 add-product: download only GitHub attachments**
  (`scripts/add-product/from-issue.js:71-82`). Done in the working tree
  2026-10-25: allowlist + no token + 50 MB cap, `persist-credentials: false`,
  the photo step has only `ISSUE_BODY` in its env, and a failure now posts
  the reason on the issue. Tests: `from-issue.test.js`, `issue-workflows.test.js`.
  - Today any URL pasted into the form (MakerWorld, Google Photos, …) is
    fetched with `Authorization: Bearer $GITHUB_TOKEN`.
  - Reuse make-short's `lib.isAttachmentUrl` allowlist and drop the header
    (the repo is public).
  - Set `persist-credentials: false` on the checkout at `add-product.yml:83`;
    create-pull-request takes the token as an input.
- [ ] **1.4 Unit tests are red on `main`, and CI doesn't run them.**
  - Add the English copy for `kola-dodge-charger-2018` and
    `statuetka-kral-i-kralitsa-…` in `src/i18n/en/content/products.json`.
  - Make a missing product translation *pending* in
    `products-page.component.spec.ts:166` and
    `related-content.component.spec.ts:94` (as `i18n.spec.ts:144` does), or
    have add-product require the English text.
  - Uncomment the test step at `.github/workflows/node.js.yml:39`. Most of
    CLAUDE.md's guards live in these Karma specs: prices vs `business.json`,
    leva, FAQ numbers, the Ignite-tag specs.
- [x] **1.5 Angular 21.2.13 → 21.2.25 (`v21-lts`).** Done in the working tree
  2026-10-25: all `@angular/*` 21.2.25, `ssr`/`cli`/`build` 21.2.28 (Ignite
  still 21.2.3). Build ✅ 44 routes, script tests 142/142, unit tests 348/350
  (the same two §1.4 failures), e2e 245/246 (one timing flake, see §2.2).
  The lockfile had to be merged by hand, see §2.13.
  - Open advisories: XSS sanitizer bypasses (GHSA-58w9-8g37-x9v5,
    GHSA-f3m7-gqxr-g87x), a platform-server serialization issue (relevant
    because the site prerenders), and router/`formatDate` DoS.
  - Bump all `@angular/*` together, plus `@angular/ssr`/`cli`/`build` 21.2.28
    and `igniteui-angular` 21.2.22.
  - Dependabot's grouped PRs **#71 and #72 can't do this**: they bump only some
    `@angular/*` packages, so `npm ci` fails with ERESOLVE on the exact peer
    pins (every check fails in ~14 s). Close them after the manual bump.
  - Most other runtime-scope Dependabot alerts don't reach the browser:
    - express, body-parser, hono, the MCP SDK, zod and proxy-addr come from
      `igniteui-theming`'s bundled MCP server;
    - jspdf and fflate come from the grid exporters (tree-shaken);
    - dompurify, mermaid and katex come from ngx-markdown.
- [x] **1.6 CodeQL's three alerts** (all low real risk; fix them so new alerts
  stand out). Fixed in the working tree 2026-10-25 as described below:
  stray brackets stripped, unsafe characters refused, slug escaped. CodeQL
  closed the `claude.js` and `scaffold-post.js` alerts after `21cecc5`. It
  kept the `article-markdown.ts` one, because a separate second `.replace`
  doesn't count for it, so that line is now one regex
  (`/<[^>]*>|[<>]/g`, same output). If the alert survives the next scan,
  dismiss it as a false positive:
  - `js/incomplete-multi-character-sanitization`,
    `src/app/blog/shared/article-markdown.ts:30`. A single-pass tag strip in
    `plainText()` for FAQ schema text built from repo markdown; a surviving
    `<…>` is not possible with this regex. Fix by stripping any remaining
    `<`/`>`, or dismiss as a false positive.
  - `js/incomplete-sanitization`, `scripts/auto-blog/claude.js:56`. The
    Windows-only `quote()` escapes `"` but not `\`. Escape backslashes too.
  - `js/regex-injection`, `scripts/auto-blog/scaffold-post.js:121`. The slug is
    interpolated into a `RegExp`. Escape it, or compare strings; this goes
    away with §3.2.

---

## 2. 🟠 Next — the following 2–3 weeks

### CI that actually protects `main`

- [ ] **2.1 One pipeline: build once → unit + e2e → deploy only when green.**
  - `github-pages.yml` has no `needs:` and deploys in parallel with CI; each
    push builds the site 5 times.
  - PRs opened with `GITHUB_TOKEN` (auto-blog, add-product, visual baselines)
    trigger no workflows at all, so automated content merges untested. Either
    open them with a GitHub App token, or run `npm run build` and the unit
    tests inside those workflows before opening the PR (auto-blog doesn't even
    build today).
- [ ] **2.2 Visual regression has been red on every push and PR since
  2026-10-14.**
  - Each new product makes `/products` taller, e.g. "Expected 1440×3992,
    received 1440×4428".
  - Regenerate the baselines, then mask the product grid or screenshot the
    viewport only.
  - The 66 full-page baselines are ~70 MB of git history per refresh.
  - The a11y check on `/blog` is flaky: axe can run while the blog cards are
    still fading in, and reports contrast of 1.18–3.73 on half-transparent
    text. It failed once locally on 2026-10-25 and passed on rerun. Run the
    functional project with `reducedMotion: 'reduce'`, or wait for the
    animation before calling axe.
- [ ] **2.3 🔒 Pin third-party actions to a commit SHA and update old ones.**
  - `peter-evans/create-pull-request@v6` runs in the job holding the Claude
    token (`auto-blog.yml`), and with write tokens in `add-product.yml:105`
    and `visual.yml:74`. Pin it, and move auto-blog's PR step to a job without
    `environment: claude`.
  - `node.js.yml` (`checkout@v2`, `setup-node@v2`, `npm i`) and
    `github-pages.yml` (`checkout@v3`, `setup-node@v2`, `npm install`): move to
    current majors, `npm ci` and `cache: npm`.
- [ ] **2.4 🔒 Smaller hardening.**
  - add-product writes `product_name=${entry.name}` to `$GITHUB_OUTPUT`
    without stripping newlines (`from-issue.js:167`). Strip CR/LF or use the
    heredoc syntax.
  - The add-product job lacks the `github.triggering_actor` re-run check that
    make-short and auto-blog have.
  - Only the first 100 comments are read (make-short `from-issue.js:168`,
    `limits.js:56-57`). Paginate; count runs, not comments, for the daily cap.
  - Per-job `permissions:` in `make-short.yml` (only `agent` needs
    `contents: write`) and `visual.yml` (write only in update mode);
    `persist-credentials: false` on the remaining checkouts.
  - The shorts tool's path arguments (`--work`, `--flow`, `--out`, `--video`,
    `--media`, `--name`; `make-short.js:47-157`, `record-flow.js:167,240-248`)
    should resolve inside the work folder only. Then retry `SHORTS_SANDBOX`.
  - auto-blog:
    - strip external links and raw HTML from generated markdown;
    - pass the Claude token only into the `claude` child process, not the
      sharp/image step (`index.js:117-118`).

### Content and facts

- [ ] **2.5 A facts guard over article text.** Nothing checks
  `src/assets/blogs/**/*.md` today (`faq.spec.ts` checks only `faq.json`;
  `i18n.spec.ts` checks only metadata). Block:
  - `same[- ]day|същия ден`;
  - „сме обработвали“, „наш клиент“;
  - „екип от (специалисти|експерти)“;
  - „фактур“;
  - € amounts, hours, days and sizes that aren't in `business.json`.
- [ ] **2.6 Bulgarian posts that contradict the facts.** Their English
  versions are already corrected, so the hreflang pairs disagree.
  - „екип от специалисти/експерти“: x2d `:274`, warhammer `:385`, litofan
    `:232`, infill `:291`, izglazhdane `:292`, kak-da-pechelim `:317`,
    prozrachen `:279`.
  - Sofia post: „Експресна логистика“ (`3d-printing-in-sofia-for-your-project.md:17`),
    plus the tag `'експресна доставка'`, the keyword `'експресно 3D принтиране'`
    and the tag `'архитектурен макет'` (`blog-posts.registry.ts:43,45`).
  - Smoothing post `:294`: „пълна гама от услуги … професионална
    постобработка“.
  - Shoe post `:273` implies we make shoes; PLA post `:230` says „гарантирано
    качество“.
  - Technical errors listed in LOCALIZATION-PLAN §5: infill `:40/:46/:139`,
    XTC-3D „1:1“ (izglazhdane `:125`), „Cura Lithophane Plugin“ (litofan `:78`).
  - Bump `dateModified` for every post whose text changes.
- [ ] **2.7 „500+ принтирани проекта“** (`main-page.component.html:38`) is not
  a `business.json` fact. Confirm it, then move it into `business.json` and
  pass it in as a placeholder; otherwise remove it.
- [ ] **2.8 Contact data and price tiers outside `business.json`** (Rule 5).
  - Phone, email and social links are typed by hand in
    `app.component.html:21,30,170,178,235,247,255`,
    `contact-me-page.component.html:28,29,44,185`,
    `contact-me-page.component.ts:75-77` and `main-page.component.html:168`.
  - The tier prices are duplicated in `prices-page.component.ts:41-66`; the
    only guard is a spec that CI doesn't run (§1.4).
- [ ] **2.9 Legacy redirect** `/blog/1-po-barzi-i-po-umni-mashini/` →
  `/blog/barzi-i-umni-3d-printeri/`, plus a `LEGACY_REDIRECTS.md` row.
  - The old URL was in the sitemap from 2026-09-21 to 2026-10-11 (renamed in
    `149c42e`) and returns 404 live.
- [ ] **2.10 `/products/` lastmod never moves**
  (`MAIN_PAGE_LASTMOD` 2026-10-18 in `scripts/generate-sitemap.js:22,28`).
  - IndexNow skipped the two newest products.
  - Derive it from the newest `dateAdded` in `products.json`, or have
    add-product bump it.
- [ ] **2.11 Auto-blog dedup** against open `auto-blog/*` branches, not only
  slugs on `main` (`scrape-ideas.js`).

### Code

- [ ] **2.12 The production 404 is the prerendered home page.**
  - `github-pages.yml:48-51` copies `index.html` over `404.html`. Live, every
    unknown URL returns the 209 KB Bulgarian home page with its canonical, so
    `src/404.html` and the "keep it in sync" rule do nothing.
  - Copy `index.csr.html` → `404.html` in `postbuild` (same locally, in e2e
    and in prod).
  - Drop `src/404.html`, its generator target, the CLAUDE.md rule and the
    related checks.
  - Give `PageNotFoundComponent` real content and `noindex`. Also `noindex` or
    remove `/error/` (prerendered, status 200, no title).
- [ ] **2.13 One npm version locally and in CI.** Found while doing §1.5:
  - npm ≤ 11.4 (local 11.4.2) and npm 10 (CI, bundled with Node 22) crash
    with `Cannot read properties of null (reading 'edgesOut')` on *any*
    re-resolution of this tree. Even a fresh install of the old
    `package.json` crashes; `npm ci` works only because it doesn't resolve.
    The trigger is `@angular/build`'s optional peer set. This is also why
    Dependabot's PRs #71/#72 failed.
  - npm ≥ 11.21 (and 12) resolves fine, but writes a lockfile without the
    nested `chokidar@5` / `readdirp@5` copies (optional peers of
    `@angular-devkit/core`). npm 10's `npm ci` then rejects it ("Missing:
    chokidar@5.0.0 from lock file").
  - The §1.5 lockfile is npm 11.21.1's output with those 8 nested pairs
    merged back by hand. Verified with `npm ci` on npm 10.9.4 and 11.4.2.
  - Fix: upgrade local npm to 11.21+, and make CI use the same version
    (`npm i -g npm@11.21.1` before `npm ci`, or a `packageManager` field with
    corepack). Then let the next `npm install` drop the nested copies.
    Until then, a plain `npm install` will crash locally.
- [ ] **2.14 The global error handler never runs in production.** There are
  no `fileReplacements`, so `environment.production` is always `false`
  (`app.config.ts:40`). Register `GlobalErrorHandlerService` unconditionally,
  and remove `environment.prod.ts` and the dead `enableProdMode`.

---

## 3. 🟡 Later — when there is time

- [ ] **3.1 Images.** `/portfolio/` loads 4.6 MB, `/products/` 2.2 MB: 1920 px
  originals in small tiles, no `width`/`height`. Generate ~800 px variants
  and cap add-product's output size.
- [ ] **3.2 Blog registry → `src/data/blog-posts.json`.** Eight scripts parse
  the TypeScript registry with diverging regexes: `generate-sitemap.js`,
  `generate-llms.js`, `internal-links.js`, `scrape-ideas.js`,
  `scaffold-post.js`, `preflight.js`, `translate-post.js` and
  `generate-blog-images.js`. JSON fits Rule 4 and makes scaffolding a plain
  append.
- [ ] **3.3 One chunk per article.** Every Bulgarian post page preloads the
  texts of all 16 posts (`blog-content:bg`, 712 KB raw), and it grows with
  each auto-post.
- [ ] **3.4 Cleanup.**
  - Unreferenced assets: 162 files, ~55 MB, under `src/assets`, all deployed
    (App Builder images, `logo.png`, an 11 MB mp4, …).
  - Stale docs: FIXES_SUMMARY, PERFORMANCE_IMPROVEMENTS,
    PRODUCT_GRID_REFACTORING, CAROUSEL_IMAGES, ARTICLE_CREATION_GUIDE,
    SEO_GUIDE. Rewrite README as a short "start here".
  - Dead code: service-worker leftovers, `src/.htaccess`, `src/test.ts`,
    unused `BlogService` methods, the contact-form attachment code.
  - Unused deps: `hammerjs`, `@angular/platform-browser-dynamic`, the stale
    `reveal-sdk-wrappers-angular` override. Declare `js-yaml` as a
    devDependency, since `issue-workflows.test.js` silently skips without it.
  - File names with spaces (e.g. `1 (2).webp`).
  - `.git` is 997 MB (old mp4s, full-page baselines).
- [ ] **3.5 Rule 1 deviations.**
  - Plain buttons where `igxButton`/`igxIconButton` exist: `app.component.html:3,52,286-293`,
    `product-grid.component.html:51,75,104`, `products-page.component.html:15,42-52`.
  - The Google "G" mark is hand-made in 5 places; one shared component with
    `igx-avatar` would replace them.
  - Emoji icons in `products-page.component.ts:58-61`.
  - Clickable `igx-icon` and `span` elements in `blog-list-page.component.html:21,81`.
  - No Ignite-tag spec for review-cta, product-grid, products-page,
    not-found and error.
- [ ] **3.6 Small SEO items.**
  - The BG home title and description don't say „София“ or the brand
    (`src/i18n/bg/seo.json:3-4`).
  - `og:image` width, height, type and alt are fixed values
    (`seo.service.ts:88-91`).
  - Bulgarian posts have English alt text; gallery alt texts have typos.
  - The plan status blocks in AI-VISIBILITY-PLAN and LOCALIZATION-PLAN are
    out of date.
- [ ] **3.7 Toolchain.**
  - Add `engines` and `.nvmrc`. Local Node 22.14 can't run Angular 22, which
    needs `^22.22.3 || ^24.15.0`.
  - Plan the v22 upgrade before v21 LTS ends (~May 2027). `provideAnimations()`
    is deprecated.
  - Karma → Vitest; specs actually run on Jasmine 4.6.
  - Tighten the initial budget to ~1.3/1.6 MB.
  - Import Ignite from secondary entry points.
  - `assets/fonts/fonts.css` is render-blocking and unseen by critical CSS.
- [ ] **3.8 CSP.** Drop `'unsafe-eval'` if hCaptcha allows it, try Angular
  `autoCsp`, and add `form-action 'self' https://api.web3forms.com`.
- [ ] **3.9 Content accuracy.** Check the Bambu Lab X2D post's specs against
  the manufacturer's page. `what-is-3d-printing` changed on 2026-10-17
  (`9a57838`), but its `dateModified` says 2026-10-12.

---

## Verified fine — don't redo

- Workflows:
  - no `pull_request_target`;
  - no `${{ github.event.* }}` interpolated into `run:`;
  - the author allowlist uses numeric ids, plus editor-history and
    `triggering_actor` checks in the jobs that hold the token.
- The make-short agent: strict MCP config, a tool allowlist, no
  WebFetch/WebSearch/git, a pinned CLI version, and budget, turn and time
  caps.
- No secrets in git history (checked token prefixes and private-key headers).
- `check:live` 66/66:
  - LocalBusiness schema = `business.json`;
  - every sitemap URL returns 200;
  - redirects, llms.txt and FAQPage are correct;
  - `lang` and reciprocal hreflang are right on all 40 pages.
- Blog: 16 registry entries ↔ 16 markdown files; dates sane; all 8 translated
  posts complete; no slash-less internal links.
- No `$exclude-components` component is used; strict TypeScript with typed
  translation keys; SSR guards are consistent.

## Re-verify

```bash
gh api repos/zdrawku/3d-pechat-website/rulesets --jq '.[].id' | xargs -I{} gh api repos/zdrawku/3d-pechat-website/rulesets/{} --jq .bypass_actors
gh api repos/zdrawku/3d-pechat-website --jq .security_and_analysis
gh api repos/zdrawku/3d-pechat-website/code-scanning/alerts?state=open --jq 'length'
npm run build && npm test -- --watch=false --browsers=ChromeHeadless && npm run test:scripts
npm run check:live
```
