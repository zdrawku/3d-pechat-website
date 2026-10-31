# Roadmap — 3dpechat.bg

What to build next, in one prioritised list. Each item is a short summary; the
detail (designs, decisions, how to build it) stays in the plan doc it links to.
Created 2026-10-31 from the open items of every `*-PLAN.md` file.

The Studio (`/studio/` → „Пътна карта“) shows this file as cards. It is read at
build time, so **edit it here and rebuild**; the parser and its spec live in
`src/app/bookmarks/studio/roadmap/`. The repo is public and the Studio's text
ships in its JavaScript: write titles and summaries only, never network
details, access codes or names of people.

Format, so the Studio can read it:

- `## <Tier>: <what the tier means>` — the tier's first word is its key
  (`Now`, `Next`, `Later`, `Waiting`, `Ideas`); a `>` line under it describes it.
- `### <title>` starts an item, followed by its fields, one per line —
  `- Area:`, `- Impact: High | Medium | Low`, `- Effort:`, `- Status:`,
  `- Details: [label](FILE.md#anchor)` — and then its description. The anchor is
  GitHub's heading id; `npm run test:scripts` checks every link
  (`scripts/roadmap-links.test.js`).
- Within a tier, items are in the order to do them.

## Now: high impact, ready to start

> Unblocked and worth doing first.

### Ship the bookmark creator
- Area: Bookmarks
- Impact: High
- Effort: Review + one real order
- Status: Built, on the feature branch
- Details: [BOOKMARKS-PLAN.md § Status](BOOKMARKS-PLAN.md#status)

The configurator at /products/bookmarks/ (picture, pattern and set modes, every engine option, live preview, order by email) and the hidden Studio. Before going live: send one real four-picture order through Web3Forms and open its order_json in the Studio, so the whole path is proven end to end.

### Fix the bookmark page's layout shift
- Area: Bookmarks
- Impact: High
- Effort: S
- Status: To investigate (CLS 0.60 on the Bulgarian page, 0.07 in English)
- Details: [BOOKMARKS-PLAN.md § Checklist](BOOKMARKS-PLAN.md#checklist)

Lighthouse measured a large layout shift on the Bulgarian bookmark page only, and the page weighs about 4.9 MB. Find what moves (likely the font list or the preview area), reserve its space, and confirm in the Lighthouse workflow on the PR.

### Fix the blocked buyer-intent post
- Area: Content & SEO
- Impact: High
- Effort: S
- Status: PR #51 blocked by claims that break business.json
- Details: [HEALTH-PLAN.md § 1. Now](HEALTH-PLAN.md#1--now--small-effort-high-impact)

The spare-part article promises same-day work, invents customer cases and names a price range that isn't in the facts. Edit it to what business.json allows and publish: it is the first of four answer-ready posts that AI assistants quote.

### One CI pipeline: build once, test, then deploy
- Area: Reliability
- Impact: High
- Effort: M
- Status: Proposed 2026-10-25
- Details: [HEALTH-PLAN.md § 2. Next](HEALTH-PLAN.md#2--next--the-following-23-weeks)

Bot-opened PRs (auto-blog, add-product, shorts) can merge without tests today. One workflow that builds, runs unit + e2e, and deploys only when green, then a ruleset requiring it. Also regenerate the visual-regression baselines, red since 2026-10-14.

### Real 404s and a working error handler
- Area: Reliability
- Impact: Medium
- Effort: S
- Status: Proposed 2026-10-25
- Details: [HEALTH-PLAN.md § 2. Next](HEALTH-PLAN.md#2--next--the-following-23-weeks)

Production serves the home page for unknown URLs, the 404 page keeps the previous page's canonical after in-app navigation, and the global error handler never runs. Serve a real noindex 404, add the missing legacy redirect, and log errors instead of jumping to /error/.

## Next: the following weeks

> Planned and designed; start when Now is clear.

### Send a bookmark order straight to the printer
- Area: Printing
- Impact: High
- Effort: 1–2 days proof, then 5–9 days
- Status: Idea, 2026-10-31; stage 1 not started

A „Изпрати за печат“ button in the Studio. The printer only accepts sliced files, so a slicer's command line turns our 3MF into a print job. The site is static and can't reach the printer, so a small relay program at the shop collects queued jobs (it connects out, nothing is opened to the internet), slices, checks that the AMS holds the order's colours, uploads and starts the print, and reports progress back to the Studio. The printer must run in its local-control mode, which turns off the maker's cloud app. Safety: the button asks „Плочата празна и чиста ли е?“ first, and the relay stops when the loaded colours don't match. Stages: (1) a command-line proof from a PC with the real printer and firmware, 1–2 days, which decides whether to go on; (2) the relay with a queue, colour check, status and retries, 3–5 days; (3) the Studio button, plate confirmation and live progress, 2–4 days. Hardware: a Raspberry Pi or an always-on PC. Still unproven: that a 3MF we build slices cleanly.

### Surprise gift box page
- Area: Catalogue
- Impact: Medium
- Effort: M
- Status: Design B approved 2026-07-13, not built
- Details: [FEATURE-IDEAS-PLAN.md § Idea 1](FEATURE-IDEAS-PLAN.md#idea-1---кутия-изненада-surprise-gift-box-product)

„Кутия Изненада“: pick a size tier and up to three of ten categories, add hints about the recipient and optional personalisation, and send a structured order to /contact. Own SEO and product schema. Later: an unboxing gallery and a gift article.

### MakerWorld ↔ site ↔ blog triangle
- Area: Content & SEO
- Impact: Medium
- Effort: S–M, plus about 1 h per article
- Status: Proposed 2026-10-11; needs its design artifact approved
- Details: [FEATURE-IDEAS-PLAN.md § Idea 6](FEATURE-IDEAS-PLAN.md#idea-6---makerworld--site--blog-the-cross-linking-triangle)

Every MakerWorld model links back with UTM tags; product cards link to their „Как направих…“ article and back, with „order ready-made“ and „download“ buttons; a MakerWorld icon next to Instagram and TikTok. Start with the jewelry-stand article. Later a /maker-story skill for the whole loop.

### Translate bookmark engine errors
- Area: Bookmarks
- Impact: Medium
- Effort: XS
- Status: Open
- Details: [BOOKMARKS-PLAN.md § W2](BOOKMARKS-PLAN.md#w2--wiring-the-real-package)

Warnings from the engine are translated already; its error codes still show the engine's English text. Add bookmarks.errors.<code> in both languages.

### Facts guard over all article text
- Area: Content & SEO
- Impact: Medium
- Effort: S
- Status: Proposed 2026-10-25
- Details: [HEALTH-PLAN.md § 2. Next](HEALTH-PLAN.md#2--next--the-following-23-weeks)

Extend the FAQ's number check to blog markdown, then fix the Bulgarian posts that contradict business.json, and confirm or remove „500+ принтирани проекта“. Keeps the pages, schema and listings agreeing, which is why AI assistants recommend the site.

### Off-site presence and reviews
- Area: AI visibility
- Impact: High
- Effort: Owner, a few hours a month
- Status: Checklists ready, owner-led
- Details: [AI-VISIBILITY-PLAN.md § Phase 6](AI-VISIBILITY-PLAN.md#phase-6--off-site-presence-owner-led-the-agent-drafts-never-sends-or-posts)

Same name, address and phone on Google Business Profile, Bing Places, Apple Business Connect and two or three Bulgarian directories; every profile links to the site; send the drafted press pitches; a QR review card in every package to close the gap to competitors (15 reviews vs 35 and 53). Re-run the monthly AI-assistant prompt panel.

### Faster, lighter pages
- Area: Performance
- Impact: Medium
- Effort: M
- Status: Partly done; re-measure first
- Details: [LIGHTHOUSE-IMPROVEMENT-PLAN.md](LIGHTHOUSE-IMPROVEMENT-PLAN.md)

Load the first-row product and blog images eagerly with a priority hint, add thumbnail sizes with srcset (/portfolio/ loads 4.6 MB), and fix the orange CTA contrast and small touch targets. The plan dates from July: check what is already done.

## Waiting: on the engine or on a decision

> Can't move until someone else answers.

### A palette per bookmark in a set
- Area: Bookmarks
- Impact: High
- Effort: 1–2 days once the engine supports it
- Status: Waiting on engine 0.2.0 (pictureColours is ignored in 0.1.0)
- Details: [Engine contract § 1.10](BOOKMARKS-ENGINE-CONTRACT.md#110-must-2026-10-31--colours-per-picture-for-real)

In „Различни снимки“ every bookmark gets its own colours. The engine must honour pictureColours in the preview, the order file and the print build, and define the four-colour AMS plate rule. Faking it on the site would print something other than what was ordered. Picker design approved (artifact section 8).

### Show „С гръб“ and „С релеф“ apart in the preview
- Area: Bookmarks
- Impact: Medium
- Effort: None on the site
- Status: Waiting on engine
- Details: [Engine contract § 1.11](BOOKMARKS-ENGINE-CONTRACT.md#111-should-2026-10-31--the-preview-shows-back-and-relief-apart)

Both previews are identical today, though the prints differ (a thin floor with deep holes vs a thick base with raised lines). The engine should draw the depth, e.g. shading on raised lines.

### Name fonts shipped by the engine
- Area: Bookmarks
- Impact: Low
- Effort: XS on the site
- Status: Decision: keep the site's copies (A) or ask the engine (B, recommended)
- Details: [BOOKMARKS-PLAN.md § Every engine option](BOOKMARKS-PLAN.md#every-engine-option-on-the-page-built-2026-10-31-uncommitted)

The font list needs small web versions of the 20 fonts (728 KB, loaded only when shown); the package has only full print TTFs (7.7 MB). Today a script downloads them from Google Fonts. Option B: the engine ships WOFF2 subsets made from the TTFs it prints with, listed in options().fonts, and the script and 36 files leave the repo.

### Legal texts and the business setup
- Area: Legal
- Impact: High
- Effort: Owner
- Status: Waiting on owner; registration planned from January 2027
- Details: [FEATURE-IDEAS-PLAN.md § Design artifacts](FEATURE-IDEAS-PLAN.md#-design-artifacts--visual-variants-per-idea)

Read the Privacy Policy and Terms before they go live (plus the bookmark privacy line), agree trader status, tax and cash register with an accountant, then add the EU legal-guarantee notice, product-safety details and the GDPR record of processing.

### English copy review
- Area: Content & SEO
- Impact: Medium
- Effort: Owner, about 2 h
- Status: Waiting on owner
- Details: [LOCALIZATION-PLAN.md § 6](LOCALIZATION-PLAN.md#6-questions-for-the-owner)

Read the English home, FAQ and the 8 English posts (their slugs are permanent), decide the /en/ landing, and pick the next posts to translate from Search Console data.

## Later: when there is time

> Worth doing, not urgent.

### Shorts from CI, end to end
- Area: Video
- Impact: Medium
- Effort: S–M
- Status: Sandbox off since 2026-10-25
- Details: [FEATURE-IDEAS-PLAN.md § Idea 8](FEATURE-IDEAS-PLAN.md#idea-8---make-short-vertical-shorts-from-the-catalog)

Turn the agent sandbox back on, take clips over 10 MB from Google Drive in CI, make the first real shorts, and later upload them to YouTube as private for the owner to publish.

### A /video page
- Area: Video
- Impact: Low
- Effort: S
- Status: Deferred until 3 or more videos
- Details: [YOUTUBE-INTEGRATION-PLAN.md](YOUTUBE-INTEGRATION-PLAN.md)

A video page or menu item once videos.json holds three videos. Meanwhile the owner's YouTube Studio checklist (thumbnails, subtitles, links, channel trailer) still applies.

### Remember the visitor's language
- Area: Content & SEO
- Impact: Low
- Effort: S
- Status: Owner decides
- Details: [LOCALIZATION-PLAN.md § 6](LOCALIZATION-PLAN.md#6-questions-for-the-owner)

Remember the chosen language, or show a dismissible „available in English“ hint, and fix the switcher's small issues (it drops ?query, its accessible name).

### Leaner build and toolchain
- Area: Reliability
- Impact: Low
- Effort: M
- Status: Proposed 2026-10-25
- Details: [HEALTH-PLAN.md § 3. Later](HEALTH-PLAN.md#3--later--when-there-is-time)

One chunk per article (712 KB preloaded today), the blog registry as JSON, remove about 55 MB of unused assets, a stricter CSP, and plan Angular 22 before v21 support ends (around May 2027).
