# YouTube Integration Plan — channel on the site + promoting the launch video

> Drafted 2026-10-14 by Claude (Fable) for an implementing agent. Status:
> **Phase 0 ✅ built 2026-10-14** (branch `zkolev/youtube-channel`, not merged).
> **Phase 1 ✅ approved 2026-10-14:** A + „Абонирай се“, own section, nothing replaced
> (https://claude.ai/artifact/FND8e5YZAk6wRq8iUozfgA).
> **Phases 2 and 3 ✅ built 2026-10-14**, uncommitted, awaiting Zdravko's review.
> Video contents and timestamps (from the storyboard frames): 0:09 book dividers,
> 0:13 pull-up bar handles, 0:17 prototypes, 0:19 coin card „България“,
> 0:23 collector models, 0:27 coin organizer, 0:31 functional parts, 0:33 how we
> work, 0:45 portfolio, 0:49 reviews, 0:53 CTA. Only the book dividers and the
> Bulgaria-map coin card (`variant-2`) are catalog products. **Phase 4** (off-site
> promotion checklist, §8) is still for Zdravko to do. Work through the phases in
> order; **Phase 1 ends with a hard stop for design approval** (CLAUDE.md Rule 2).
>
> Read [`CLAUDE.md`](CLAUDE.md) first. Every rule there applies, and three of
> them bite here specifically: Ignite UI components only (Rule 1), design artifact
> before user-facing work (Rule 2), curated data in JSON/TS and no runtime fetch
> (Rule 4). Never bulk-edit through PowerShell 5.1 (Rule 3) — this plan and all
> copy below are Cyrillic.

## 0. Facts (verified 2026-10-14 via YouTube oEmbed + watch page)

| Item | Value |
|------|-------|
| Channel name | `3D Печат Услуги` |
| Channel handle / URL | `@3dpechatbg` → `https://www.youtube.com/@3dpechatbg` |
| Channel ID | `UCe-6sDdk9n6nORVaUIjvsRQ` |
| Subscribe deep link | `https://www.youtube.com/@3dpechatbg?sub_confirmation=1` |
| Promo video ID | `f8yTuEcOCjU` |
| Watch URL | `https://www.youtube.com/watch?v=f8yTuEcOCjU` (short: `https://youtu.be/f8yTuEcOCjU`) |
| Privacy-enhanced embed | `https://www.youtube-nocookie.com/embed/f8yTuEcOCjU` |
| Title (as uploaded) | `3D печат по поръчка в София \| Прототипи, части и подаръци – 3dpechat.bg` |
| Description (first line) | `Професионален 3D печат и 3D принтиране по поръчка в София – прототипи, функционални части, макети, подаръци и малки серии. Заявете безплатна оферта от сайта 3dpechat.bg` |
| Duration | `PT1M1S` (61 s) |
| Published | `2026-10-13T22:15:17-07:00` = `2026-10-14T08:15:17+03:00` (use the +03:00 form in schema) |
| Posters | `https://i.ytimg.com/vi/f8yTuEcOCjU/maxresdefault.jpg` (1280×720, HTTP 200), `hqdefault.jpg` (480×360) |

Note the channel handle has **no dot** (`@3dpechatbg`), unlike Instagram/TikTok
(`3dpechat.bg`). Do not "fix" it.

## 1. What the site has today (so you don't rebuild it)

- **Social links live in two shells + one page:** navbar icon buttons and footer
  icons in [`app.component.html`](src/app/app.component.html) (Instagram, TikTok,
  each with `igxTooltip`), and "social pills" on the contact page
  ([`contact-me-page.component.html`](src/app/contact-me-page/contact-me-page.component.html)
  with `openInstagram()` / `openTikTok()` in the `.ts`). Icons come from
  `@igniteui/material-icons-extended` and are registered in
  [`app.component.ts:32-33`](src/app/app.component.ts#L32-L33) under the
  `imx-icons` family. **That package exports `youtube`** (`socialMedia.d.ts`),
  so no custom SVG is needed.
- **Shared external URLs** live in [`src/data/site-links.ts`](src/data/site-links.ts).
- **Site-wide `Organization` JSON-LD with `sameAs`** sits in
  [`src/index.html`](src/index.html) and is duplicated in
  [`src/404.html`](src/404.html) (keep in sync — standing rule).
- **CSP** is the first tag in both HTML files. `frame-src` currently allows only
  hCaptcha, so **a YouTube iframe is blocked until `frame-src` is extended** in
  both files. `img-src 'self' data: https:` already allows `i.ytimg.com`.
- **Per-page SEO** goes through `SeoService.updateSeo()` /
  `setStructuredData()` ([`seo.service.ts`](src/app/services/seo.service.ts)).
  The home page currently calls `removeStructuredData()`.
- **Blog articles** = markdown in `src/assets/blogs/<slug>.md` + a standalone
  component in `src/app/blog/<slug>/` + an entry in
  [`blog.service.ts`](src/app/services/blog.service.ts) + a route in
  [`app.routes.ts`](src/app/app.routes.ts). Use
  [`monetna-karta-bulgarski-evro-moneti`](src/app/blog/monetna-karta-bulgarski-evro-moneti/monetna-karta-bulgarski-evro-moneti.component.ts)
  as the template (SEO constants, `@graph` JSON-LD, `<app-related-content>`).
  Markdown is rendered by `ngx-markdown` with default sanitisation, which
  **strips `<iframe>`** — the player must be an Angular component in the article
  template, not HTML inside the `.md`.
- **Product cards** accept data-only `links: ProductLink[]` (icon button + tooltip,
  Material icon name, see
  [`product-grid.component.html:64-72`](src/app/shared/product-grid/product-grid.component.html#L64-L72)).
- **Tests:** Karma specs per component (the Ignite-tag assertion pattern is in
  [`happy-customers.component.spec.ts:51`](src/app/shared/happy-customers/happy-customers.component.spec.ts#L51)),
  Playwright `e2e/shell.spec.ts` "external links" test checks Instagram/TikTok
  hrefs + `rel`, `e2e/routes.ts` lists blog routes for smoke/SEO/sitemap tests,
  and `visual.spec.ts` snapshots will need updating when the home page changes.
- `npm run build` runs `prebuild` (lint, images, sitemap, llms, blog content).

## 2. Deliverables at a glance

| # | Deliverable | Phase | Design artifact? |
|---|-------------|-------|------------------|
| D1 | YouTube icon link in navbar, footer, contact page; `sameAs`; CSP; constants | 0 | No — exact copy of the existing TikTok treatment (judgment call, see §3) |
| D2 | Design artifact: where/how the video appears on the site | 1 | **Is** the artifact — hard stop |
| D3 | `app-youtube-embed` facade player component (poster → iframe on click) | 2 | Covered by D2 |
| D4 | Home-page video section + `VideoObject` JSON-LD | 2 | Covered by D2 |
| D5 | Blog article around the video (its own indexable page) | 3 | Covered by D2 (CTA panel) |
| D6 | Product-card „Виж във видеото“ links (data only) | 3 | Covered by D2 (icon panel) |
| D7 | Off-site promotion checklist for Zdravko (YouTube Studio, GBP, socials, UTM) | 4 | n/a — no code |
| D8 | Docs: FEATURE-IDEAS-PLAN.md Idea 7 + artifacts table row, AI_INSTRUCTIONS.md | 2–3 | n/a |

---

## 3. Phase 0 — Plumbing (one PR, no visual decisions)

Everything here mirrors an existing pattern 1:1, so it ships before the design
artifact. If Zdravko disagrees with that call, fold the icon placement into the
Phase 1 artifact instead.

### 3.1 Data (Rule 4)

- `src/data/site-links.ts` — add, with doc comments in the existing style:
  ```ts
  export const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@3dpechatbg';
  export const YOUTUBE_SUBSCRIBE_URL = 'https://www.youtube.com/@3dpechatbg?sub_confirmation=1';
  ```
- New `src/data/videos.json` (+ `src/app/models/video.model.ts`), one entry now,
  shaped so a second video is a JSON append:
  ```json
  {
    "videos": [
      {
        "id": "f8yTuEcOCjU",
        "slug": "promo-2026-10",
        "featured": true,
        "title": "3D печат по поръчка в София | Прототипи, части и подаръци – 3dpechat.bg",
        "description": "Професионален 3D печат и 3D принтиране по поръчка в София – прототипи, функционални части, макети, подаръци и малки серии.",
        "uploadDate": "2026-10-14T08:15:17+03:00",
        "duration": "PT1M1S",
        "poster": "assets/real-images/main-images/promo-video-poster.webp",
        "posterAlt": "Кадър от видеото: 3D принтирани прототипи, части и подаръци от 3dpechat.bg"
      }
    ]
  }
  ```
  Document the file in [`src/data/README.md`](src/data/README.md).
- Poster: download `maxresdefault.jpg`, convert with
  `scripts/convert-images-to-webp.js` to
  `src/assets/real-images/main-images/promo-video-poster.webp` (1280×720, aim
  ≤ 80 KB). Self-hosting keeps the prerendered page free of third-party requests
  until the visitor clicks play.

### 3.2 Icon + links (Rule 1)

- `app.component.ts`: `import { instagram, tiktok, youtube } from '@igniteui/material-icons-extended';`
  and register `youtube` like the other two.
- `app.component.html`: add a third navbar `igxIconButton="flat"` after TikTok
  (`href` = `YOUTUBE_CHANNEL_URL` via a component field, `target="_blank"`,
  `rel="noopener noreferrer"`, `aria-label="YouTube канал"`, tooltip
  „Гледайте ни в YouTube“) and a third footer icon (tooltip
  „YouTube: Видеа от нашата работилница“).
- Contact page: third `social-pill` button „YouTube“ + `openYouTube()` + tooltip
  „Гледайте как работим в нашия YouTube канал“.
- Do **not** add a nav-drawer item or a `/video` route yet — one video does not
  justify a page. Revisit when `videos.json` has ≥ 3 entries.

### 3.3 Schema + CSP (both `src/index.html` and `src/404.html`)

- `Organization.sameAs`: append `"https://www.youtube.com/@3dpechatbg"`.
- CSP `frame-src`: append `https://www.youtube-nocookie.com` (only that host —
  the facade in Phase 2 never embeds `youtube.com`). No `script-src` change: we
  do not load the IFrame Player API.
- After editing, `diff` the two heads; they already differ in the gtag/theme-boot
  blocks, so compare the CSP and JSON-LD blocks specifically.

### 3.4 Tests

- `app.component.spec.ts`: new `it('links the YouTube channel from navbar and footer with safe rel')`
  — `a[href="https://www.youtube.com/@3dpechatbg"]` count ≥ 2, each has
  `rel` containing `noopener`, each contains `igx-icon[name="youtube"]`.
- `contact-me-page.component.spec.ts`: `openYouTube()` opens the channel URL
  (mirror whatever the TikTok test does).
- `e2e/shell.spec.ts` "external links": add the YouTube locator alongside
  Instagram/TikTok.
- `e2e/seo.spec.ts`: add a test that `/` contains `#organization-jsonld` whose
  `sameAs` includes the YouTube URL (parse the script text).

### 3.5 Optional, cheap

- `scripts/generate-llms.js`: add a "Профили" block with Instagram, TikTok,
  YouTube, MakerWorld URLs so `llms.txt` points AI crawlers at the channel.

---

## 4. Phase 1 — Design artifact (HARD STOP for approval)

Produce **one** claude.ai artifact in the established format (3DPechat.bg
branding: orange `#FF5722` / blue `#2196F3` on paper tones, light + dark toggle,
browser-frame mockups per variant at desktop and mobile, real Bulgarian copy
from §7, green "Recommended" badge, verdict at the bottom). Add its URL to the
"Design artifacts" table in [`FEATURE-IDEAS-PLAN.md`](FEATURE-IDEAS-PLAN.md)
and create an **"Idea 7 — ▶️ YouTube channel + promo video"** section there.

### Variants to show (home page placement)

- **A — „Вижте ни в действие“ section between PROCESS and ABOUT (recommended).**
  Two-column: facade player (16:9, poster, big play button, duration chip
  „1:01“) left; eyebrow „Видео“, heading, 2-line description, two CTAs
  (`igxButton="contained"` „Заяви оферта“, `igxButton="outlined"` „Абонирай се“
  with YouTube icon) right. Stacks on mobile. Why recommended: it sits where the
  visitor has just read *how* we work and now *sees* it; keeps the approved hero
  animation (7Г) untouched; no LCP impact because the poster is below the fold
  and lazy.
- **B — Hero media swap.** The facade replaces the hero print-frame image. Show
  it, but mark it *not recommended*: it discards the approved hero animation and
  moves a heavy element into the LCP slot.
- **C — Inside the ABOUT block.** Player replaces the `igx-carousel` photo
  gallery (or sits above it). Cheap, but it buries the video and removes
  the gallery.
- **D — Slim video band under the hero.** One-row banner: small poster
  thumbnail + „Гледай 60-секундното ни видео“ + play icon; clicking opens the
  player inline (expands) rather than a modal (`igx-dialog` is excluded from the
  theme anyway). Good as a *secondary* idea if A is felt too heavy.

### Panels that must also be in the artifact

- **Player facade states:** poster idle, hover (play button scales, violet SLA
  sweep via `sla-hover` mixin), playing (iframe filled), keyboard focus ring;
  light and dark; mobile width.
- **Blog article CTA block** (for Phase 3): player at the top of the article,
  „Абонирай се“ + „Заяви оферта“ row at the bottom.
- **Product-card video link:** the existing link-button row with a
  `play_circle` Material icon and tooltip „Виж във видеото“.
- **Navbar/footer/contact icon** as shipped in Phase 0 (for the record).

**Stop here.** Post the artifact link, wait for Zdravko's pick, record it as
`✅ APPROVED` in FEATURE-IDEAS-PLAN.md, then continue.

---

## 5. Phase 2 — Implement the approved variant

### 5.1 `src/app/shared/youtube-embed/` (new, standalone)

- Selector `app-youtube-embed`; inputs `videoId`, `title`, `poster`, `posterAlt`,
  optional `duration`; `IGX_CARD_DIRECTIVES` + `IgxIconButtonDirective` +
  `IgxIconComponent` in `imports`.
- Markup: `igx-card` → `igx-card-media` holding `<img [src]="poster" loading="lazy"
  decoding="async" width="1280" height="720">` + a centred `<button igxIconButton="contained" (click)="play()" [attr.aria-label]="'Пусни видеото: ' + title">`
  with `<igx-icon>play_arrow</igx-icon>`; `aspect-ratio: 16 / 9` on the media
  box; `--radius-*`/`--shadow-*` tokens; `sla-hover` on the card.
- `play()` (browser only — guard with `isPlatformBrowser`): set `playing = true`
  and render `<iframe [src]="safeSrc" title="{{title}}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" loading="lazy">`
  where `safeSrc` = `DomSanitizer.bypassSecurityTrustResourceUrl('https://www.youtube-nocookie.com/embed/<id>?autoplay=1&rel=0&playsinline=1&modestbranding=1')`.
- Warm-up: on first `pointerenter`/`focus` of the card, inject
  `<link rel="preconnect" href="https://www.youtube-nocookie.com">` and
  `https://www.google.com` (one-time flag). Not required; keep if trivial.
- Emit a GA4 event on play: `gtag('event', 'video_start', { video_id, video_title, page_location })`
  guarded by `typeof gtag === 'function'`.
- Spec (`youtube-embed.component.spec.ts`):
  - "builds the facade from Ignite UI components" — `igx-card`, `igx-card-media`,
    `button[igxIconButton]`, `igx-icon` present.
  - renders **no** `iframe` before interaction (keeps prerender clean).
  - after `play()`, exactly one `iframe` whose `src` starts with
    `https://www.youtube-nocookie.com/embed/f8yTuEcOCjU` and contains `autoplay=1`.
  - poster `img` has `alt === posterAlt` and `loading="lazy"`.

### 5.2 Home page section (variant per approval; copy in §7)

- Add the section to [`main-page.component.html`](src/app/main-page/main-page.component.html)
  using the existing `home_section` / `section_inner` / `section_eyebrow` /
  `section_heading` classes; buttons via `igxButton`. Import `YoutubeEmbedComponent`.
- Data: `import videosData from '../../data/videos.json'`; pick `featured`.
- Structured data: replace `this.seoService.removeStructuredData()` with
  `setStructuredData({ "@context": "https://schema.org", "@type": "VideoObject", ... })`
  using `name`, `description`, `thumbnailUrl` (absolute `https://3dpechat.bg/<poster>`
  **and** the `i.ytimg.com` maxres URL), `uploadDate`, `duration`, `contentUrl`
  (watch URL), `embedUrl` (nocookie embed), `publisher: { "@id": "https://3dpechat.bg/#organization" }`.
  Keep it a single object (no `@graph`) so SeoService's one script tag suffices.
- `main-page.component.spec.ts`: section present, `app-youtube-embed` present,
  JSON-LD script contains `"@type":"VideoObject"` and the video ID.

### 5.3 Verification for this phase

- `npm run build` and `npm test -- --watch=false --browsers=ChromeHeadless` green.
- `npx ng serve` + Playwright screenshots of `/` in light and dark at 1280 and
  390 px, attached to the PR; click play once in a real browser and confirm the
  DevTools console shows **no CSP `frame-src` violation**.
- `npm run e2e` green; `npm run e2e:visual:update` for the home snapshots (CI
  `visual.yml` will fail otherwise) — commit the updated PNGs.
- Paste the prerendered `dist/.../browser/index.html` into Google's Rich Results
  Test (or `npx schema-dts` validation) — `VideoObject` must validate.
- Lighthouse (`npm run lighthouse`): confirm no new third-party request before
  interaction and no CLS from the player box (explicit `aspect-ratio`).

---

## 6. Phase 3 — On-site promotion of the video

### 6.1 Blog article (the only page Google can rank *for the video*)

- Slug `3d-pechat-po-porachka-sofia-video`, date **2026-10-14**, tags
  `['видео', 'YouTube', '3D печат София', 'прототипи', 'подаръци', 'по поръчка']`.
- Files: `src/assets/blogs/<slug>.md`, `src/app/blog/<slug>/` component (copy the
  monetna-karta component, drop the MakerWorld substitution), entry in
  `blog.service.ts`, route in `app.routes.ts`, route in `e2e/routes.ts`, cover
  image = the poster webp (also reuse as `IMAGE`), `npm run generate-sitemap`.
- Template: `<app-youtube-embed>` **above** `<markdown>`, article CTA row at
  the bottom gains an `igxButton="outlined"` „Абонирай се в YouTube“ linking to
  `YOUTUBE_SUBSCRIBE_URL`.
- JSON-LD `@graph`: `Article` (as in the template) **plus** the same `VideoObject`
  as the home page, with `mainEntityOfPage` set to the article URL. Two pages
  sharing one video is fine; the article is the one meant to rank.
- Body outline (~600–800 words, Bulgarian, H2s): „Какво ще видите във видеото“
  (the project types shown — ask Zdravko which exact prints appear), „Как
  протича една поръчка“ (reuse the 4-step process), „Защо София / защо ние“,
  „Поръчайте същото или нещо свое“ (link to `/products` cards by `#linkId` and
  `/contact`), FAQ (3 questions → `FAQPage` only if the answers are visible in the
  article, as the template does).
- `<app-related-content slug="...">` needs no work.

### 6.2 Product cards (data only, `src/data/products.json`)

- For each product that visibly appears in the video (ask Zdravko for the list
  + rough timestamps), append to `links`:
  `{ "label": "Виж във видеото", "url": "https://youtu.be/f8yTuEcOCjU?t=<sec>", "icon": "play_circle" }`.
- `/add-product` skill: mention in its SKILL.md that a `links` entry with
  `icon: "play_circle"` is the convention for a video reference.

### 6.3 Docs

- `AI_INSTRUCTIONS.md`: short "Video" subsection under Component Usage
  (`app-youtube-embed`, `videos.json`, CSP note, "never iframe inside markdown").
- `FEATURE-IDEAS-PLAN.md`: mark Idea 7 items in the build-order table.
- `src/data/README.md`: `videos.json` schema.

---

## 7. Copy (Bulgarian, ready to paste — adjust only if the approved variant needs it)

- Eyebrow: `Видео`
- Heading: `Вижте ни в действие`
- Description: `За 60 секунди: как превръщаме идея в готов детайл — прототипи, функционални части, макети и подаръци, отпечатани в София.`
- Primary CTA: `Заяви оферта →` (→ `/contact`)
- Secondary CTA: `Абонирай се` + YouTube icon (→ subscribe URL, new tab)
- Duration chip: `1:01`
- Play button aria-label: `Пусни видеото: 3D печат по поръчка в София`
- Navbar tooltip: `Гледайте ни в YouTube` · Footer tooltip: `YouTube: Видеа от нашата работилница` · Contact tooltip: `Гледайте как работим в нашия YouTube канал`
- Article title: `Вижте как работим: 3D печат по поръчка в София (видео)`
- Article meta description: `60-секундно видео от работилницата на 3dpechat.bg: прототипи, функционални части, макети и подаръци, отпечатани в София. Как протича поръчката и как да заявите своята.`
- Product link tooltip: `Виж във видеото`

---

## 8. Phase 4 — Off-site promotion checklist (hand to Zdravko; no code)

UTM scheme for every link that points back at the site:
`?utm_source=youtube&utm_medium=video&utm_campaign=promo-2026-10&utm_content=<where>`
(`description`, `pinned-comment`, `channel-about`, `end-screen`). GA4 `G-YBR644GQL9`
already records these; the `/products/` canonical is hard-coded so UTMs create no
duplicate URLs.

**YouTube Studio (video)**
- [ ] Description: first 2 lines = what + city + CTA with the UTM link to `https://3dpechat.bg/contact/`; then links to `/products/`, `/prices/`, the article from §6.1, Instagram, TikTok, MakerWorld; phone + Viber.
- [ ] Pinned comment with the offer link; reply to every comment in the first week (ranking signal).
- [ ] Custom thumbnail (not the auto frame), Bulgarian title kept, language = Bulgarian, add English subtitles (auto-translate is fine) — makes the video surface for „3D printing Sofia“.
- [ ] Tags/keywords: `3D печат София, 3D принтиране по поръчка, прототипи, 3D печат подаръци, 3dpechat`.
- [ ] End screen (last 5–20 s): Subscribe element + "best for viewer". External-link cards/end screens require the YouTube Partner Program — skip until eligible.
- [ ] Add to a playlist „3D печат по поръчка“ so the channel page is not empty.

**YouTube Studio (channel)**
- [ ] Channel "About": description with `3dpechat.bg` UTM link, address, phone; add site + socials in the links block (these show above the fold).
- [ ] Banner + avatar from `assets/logo.png` / `og-image.png`; set the promo video as the **channel trailer** for non-subscribers.
- [ ] Verify the site in YouTube Studio (Settings → Channel → Advanced) so the website shows as the associated site.

**Shorts & cross-posting** (61 s fits all short formats)
- [ ] Export a 9:16 crop and publish as a **Short** with `#3Dпечат #София` — Shorts reach non-subscribers far better than long-form.
- [ ] Post the same cut to **TikTok** and **Instagram Reels** with the watch link in bio/comments; mention „пълното видео в YouTube“.

**Google surfaces**
- [ ] **Google Business Profile:** add the video to Photos/Videos and publish a "What's new" post linking to the watch URL (GBP posts expire after 6 months — recreate). The GBP place ID is in `site-links.ts`.
- [ ] After the site deploy: in Search Console request indexing for `/` and the §6.1 article (indexing is already slow for this site — see GSC notes), then check the **Video pages** report after ~2 weeks.

**Everywhere else**
- [ ] MakerWorld profile bio (`@zdkolev`) + model descriptions: one line with the watch URL.
- [ ] Email signature and Viber Business auto-reply: „▶ Вижте как работим (60 сек)“ + link.
- [ ] Personal LinkedIn/Facebook post the launch week; ask the happy customers from `reviews.json` for a share.

---

## 9. Definition of done

- Phase 0, 2, 3 each shipped as its own PR against `main` (branch naming as in
  recent history, e.g. `zkolev/youtube-channel-links`), PR body ends with the
  attribution line from the session reminder, Playwright screenshots attached.
- `npm run build`, `npm test -- --watch=false --browsers=ChromeHeadless`,
  `npm run e2e` all green; visual snapshots updated and committed.
- `src/404.html` CSP + `sameAs` identical to `src/index.html`.
- `sitemap.xml` lists the new article; `VideoObject` validates on `/` and on the article.
- No `iframe`, no `youtube` host request in prerendered HTML before interaction.
- FEATURE-IDEAS-PLAN.md has Idea 7 with the approved variant and artifact URL.

## 10. Open questions for Zdravko (ask up front, keep working meanwhile)

1. Which products/prints appear in the video, with rough timestamps? (drives §6.2 links and the article's first section)
2. Is a 9:16 Shorts cut available or should it be made from the 16:9 master?
3. OK to ship the navbar/footer/contact icons (Phase 0) before the design artifact, as a copy of the TikTok pattern?
4. Should the secondary CTA say „Абонирай се“ or the softer „Виж канала“?
