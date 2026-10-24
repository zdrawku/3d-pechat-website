---
name: make-short
description: Make a 15–25 s vertical short (TikTok, YouTube Shorts, Reels) for 3dpechat.bg from a request in words — a product reveal from uploaded clips/photos plus catalog photos, a phone-screen recording of a website flow (e.g. „как се поръчва в 3 стъпки“), or both. Writes the Bulgarian captions and voiceover, checks them against business.json, renders short.mp4 + cover.jpg + post.txt. Runs locally and as the agent behind the „🎬 Ново кратко видео“ GitHub issue. Use when the user says "/make-short", "make a short", "направи кратко видео/шорт", or asks for a TikTok/Shorts/Reels video.
---

# Make a short

You are the whole production team: read the request, pick or record the
footage, write the storyboard, render, look at the result, report. Approved
look (FEATURE-IDEAS-PLAN.md Idea 8): word-pop captions, paper end card,
1080 × 1920, Bulgarian voice `bg-BG-KalinaNeural` by default.

All work goes through one tool, in one work folder `W`:

```bash
npm run make-short -- <command> --work W …
```

`record` (website flow), `drive` (product's Drive folder), `prepare` (media →
previews), `check` (spec.json), `render`, `frames` (stills to look at).
Run `node scripts/make-short/make-short.js` with no command for usage.

## In GitHub Actions

You were started by `.github/workflows/make-short.yml` with a prompt naming
`W` (e.g. `tmp/make-short/issue-12`). You can read the repo, write **only
inside W**, and run **only `npm run make-short -- …`** — no other shell
commands, no web access, no git. Nobody is watching; don't ask questions,
decide and explain in result.md.

- `W/request.md` — the request, the conversation (newest last — the latest
  comment is what matters now), the uploaded files under `W/uploads/`, and
  whether there is a previous version in `W/previous/` (spec.json, flows/).
- Render with the default `--out` (`W/out/`). Keep your spec at `W/spec.json`
  and flows at `W/flows/<name>.json` — they are saved for the next round.
- **Finish by writing `W/result.md`**, in Bulgarian, 3–8 short lines: what the
  video shows beat by beat, which files/recording it used, any assumption or
  anything you couldn't do. No links (they are added for you). If you
  deliberately didn't render (the request is outside the business, or would
  need a claim the facts don't allow), say why and what would make it work.
- Feedback round (there is a `W/previous/`): start from the previous spec and
  flows, change only what the latest comment asks, re-record only if a flow
  changed, and say in result.md what you changed.
- **The run is capped** (estimated spend, steps and minutes — see the env at
  the top of `make-short.yml`); past a cap you are stopped mid-work. So work
  lean: read each preview once, record once, render once, and write
  result.md as soon as the video is good enough.

## Locally

The user gives the request in chat, plus files or a folder (pasted files, a
folder such as `G:\My Drive\3dpechat-shorts\<linkId>\`). Use
`--work tmp/make-short/<something>` and pass their files with `--media`.
Show the storyboard (beats, voice lines, end card) before rendering when the
user is around; render to `--out shorts/<name>/` (gitignored). Afterwards offer
to copy the files into the product's Drive folder under `_shorts/`.

## Steps

1. **Understand the request.** Which kind of short?
   - **Product** — find it in `src/data/products.json` (Grep the name or
     tags). Its catalog photos are added automatically with `--product`.
   - **Website flow** — "how to order", "how the calculator works", "where to
     find X": record it (step 3).
   - **Both**, or something general about the workshop (FDM printing,
     materials, order process) built from uploads + site recording.
   If the request is unclear, choose the most useful reading and say so in
   result.md.

2. **Gather footage.** Uploaded clips are the best material: movement in the
   first second keeps people watching, so open with a clip when there is one.
   For a product, also `npm run make-short -- drive --work W --product <linkId>`
   (does nothing when Drive isn't connected).

3. **Record the website** (only if the request needs it). Write
   `W/flows/<name>.json` and run
   `npm run make-short -- record --work W --flow W/flows/<name>.json`.
   The flow is JSON steps (see `scripts/make-short/record-flow.js`):
   `goto` (path), `mark` (name a moment), `scroll` (px), `scrollTo` (target),
   `tap` (target), `type` (target + text), `wait` (ms). A target is
   `{selector}`, `{text}`, `{role, name}` or `{placeholder}`, optionally with
   `nth` and `within: {selector, text}`. Put a `mark` at the start of every
   step you want to caption — the command prints their times.
   - Only `https://3dpechat.bg` (default) or localhost. Consent is answered
     „отказвам“, the review pop-up is suppressed, analytics and the contact
     form's endpoint are blocked: **never tap „Изпрати съобщение“** anyway.
   - Stable targets: product card order button
     `{"selector": "[data-testid=product-order-btn]", "within": {"selector": "igx-card", "text": "<product name>"}}`;
     contact fields `{"placeholder": "Вашето име"}`, `{"placeholder": "Вашият имейл"}`;
     calculator `[data-testid=calc-grams]`, `calc-tier`, `calc-total`,
     `calc-order-btn` on `/prices/`. Pages: `/`, `/products/`, `/prices/`,
     `/contact/`, `/portfolio/`. Other selectors: Grep `src/app/**/*.html`.
   - Type example data only (e.g. „Мария“, `maria@example.com`).
   - Example — order in 3 steps: `goto /products/`, mark step1, `scrollTo`
     the product, mark step2, `tap` its order button, mark step3, `type` name
     and e-mail, `scrollTo` „Изпрати съобщение“, `wait` 1500.
   - Look at the recording before using it, 3–4 stills at the marks:
     `npm run make-short -- frames --work W --video W/recordings/<name>.mp4 --at 1,4,8`.
     Re-record only if a step visibly failed (wrong page, nothing tapped) —
     each recording takes about a minute.
   - Captions over a recording go on a dark box at the top (`"position": "top"`),
     so they read over any page.

4. **Prepare:** `npm run make-short -- prepare --work W [--product <linkId>] --media W/uploads --media W/recordings --media W/drive`
   (missing folders are fine). It prints ids `m1…` and preview files.
   **Read every preview** — clip frames are named `m2-4s.jpg` (clip m2 at 4 s).

5. **Write `W/spec.json`:**
   ```json
   {
     "product": "darzhach-za-evro-moneti-fidzhet-spinar",
     "voice": "bg-BG-KalinaNeural",
     "beats": [
       { "source": "m1", "start": 4, "caption": "Къде държите евромонетите?", "highlight": "евромонетите?", "voiceover": "Къде държите евромонетите?" },
       { "source": "m3", "start": 0, "caption": "Гнезда за 2 €, 1 € и 50 евроцента", "highlight": "50 евроцента", "voiceover": "По около 7 монети във всяко гнездо." },
       { "source": "m2", "start": 0, "caption": "Върти се между пръстите", "highlight": "пръстите", "voiceover": "А версията спинър се върти, без метални части." }
     ],
     "endCard": { "line": "Отпечатан на 3D принтер в София", "voiceover": "Отпечатан на 3D принтер в София. 3dpechat.bg." },
     "post": {
       "link": "/products/",
       "tiktok": {
         "caption": "Държиш ли още евромонетите в джоба? 👀\n\nТози държач събира 2 €, 1 € и 50 евроцента — и се върти като спинър.\nОтпечатан на 3D принтер в София.\n\nКакво да отпечатаме следващо? Пиши ни 👇",
         "hashtags": ["#3dпечат", "#3dprinting", "#евромонети", "#подарък", "#софия"]
       },
       "youtube": {
         "title": "Държач за евро монети, който се върти 🌀 | 3D печат",
         "description": "Гнезда за монети от 2 €, 1 € и 50 евроцента, по около 7 във всяко — и версия спинър без метални части.\nОтпечатан на 3D принтер в нашата работилница в София.\n\nАбонирай се за още отпечатани идеи. Безплатна оферта на 3dpechat.bg",
         "tags": ["3d печат", "3d printing", "3д печат", "3d pechat", "държач за монети", "евро монети", "фиджет спинър", "подарък", "софия"]
       },
       "pinnedComment": "За бюрото или за подарък — ти за какво би го взел? 👇"
     }
   }
   ```
   - 2–6 beats, then the end card; 15–25 s in total. `product` only when the
     short is about one. `voice`: `bg-BG-KalinaNeural`, `bg-BG-BorislavNeural`,
     or `null` (music only — then every `voiceover` is `""`). Follow what the
     request says about voice.
   - `start`: where a clip beat begins (seconds; from frames or marks); 0 for photos.
   - `seconds` (optional, 1.5–8): how long the beat lasts at least — use it for
     recording beats so the whole step is shown (gap between two marks).
   - `position`: `"top"` for captions over a website recording (the action is
     in the middle), otherwise leave it out.
   - caption ≤ 6 words / 40 characters, no emoji; numbered steps are fine
     („1. Избери продукт“). `highlight`: 1–2 words copied exactly from the caption (orange).
   - voiceover: one sentence ≤ 12 words that adds to the caption.
   - **Only what the footage shows or the facts say.** Numbers only from
     `src/data/business.json` facts, the product text, or the request. Euro
     only. Never what `neverClaim` lists: SLA/resin, SLS, scanning, same-day,
     invoices, fixed modeling prices, invented reviews/customers.
   - `post` is the upload copy — see „Upload copy“ below. `check` validates it
     with the same facts rules as the video.

## Upload copy — grow the audience

The short is half the job; the text under it decides whether people stop,
comment and follow. Write it in Bulgarian, warm and specific, like the
workshop talking — not an ad. Emoji are fine here (1–3), not in the video.
The code adds the tracked link, `#shorts` and the YouTube hashtags for you.

- **`link`** — the site page the call to action points to: `/products/` for a
  product, `/prices/` for prices/calculator, `/contact/` for "how to order",
  `/` otherwise. It becomes a tracked link (Analytics shows which short
  brought each visit).
- **TikTok `caption`** (also used for Reels):
  - **Line 1 is the hook** (≤ 100 chars, shown before „още“): a question the
    viewer recognises („Държиш ли още евромонетите в джоба?“), a surprising
    detail, or a promise („3 стъпки и поръчката е готова“). Never „Здравейте“.
  - 1–3 short lines: what it is and one concrete fact from the footage,
    product text or facts.
  - **End with one call to action**, chosen for this short: a comment prompt
    („Какво да отпечатаме следващо? 👇“ — comments push reach most), follow
    („Последвай за още отпечатани идеи“), save/share („Запази го за
    подарък“), or the offer („Безплатна оферта на 3dpechat.bg“). Mention
    3dpechat.bg in the text — TikTok captions aren't clickable, the name is.
  - No hashtags in the caption — they go in `hashtags`.
- **`hashtags`** (3–8): one broad English (#3dprinting), one or two Bulgarian
  niche (#3dпечат, #3dпринтиране), one local (#софия or #българия), one or two
  about the product or occasion (#подарък, #евромонети, #геймър). Never
  #fyp/#viral/#foryou — `check` refuses them.
- **YouTube `title`** (≤ 100, best ≤ 70): the searchable thing first
  („Държач за евро монети…“, „Как се поръчва 3D печат…“), then a curiosity
  hook. No clickbait the video doesn't deliver.
- **YouTube `description`**: 2–4 lines that add to the title, then
  „Абонирай се…“ and the offer. No links, no hashtags (added automatically).
- **YouTube `tags`** (5–20): Bulgarian and English, plus the spellings people
  actually type — transliterated („3d pechat“, „3д печат“), product words,
  occasion („подарък“), place („софия“). No `#`, no commas.
- **`pinnedComment`**: the team writes it first and pins it. An easy
  question with two answers („за бюрото или за подарък?“), or „Какво да
  отпечатаме следващо? 👇“ — every reply helps the next viewers find it.
- **Facts still rule:** only what the footage, product text, facts or request
  say. The offer is a free *quote* („безплатна оферта“) — never free prints,
  giveaways, discounts or deadlines that aren't in business.json.

6. **Check:** `npm run make-short -- check --work W`; fix until it passes. A
   number the facts contain can still be misused — reread every line.

7. **Render:** `npm run make-short -- render --work W` (music from `W/music/`
   if the Drive step found any; otherwise none). About 30 s.

8. **Look at it:** `npm run make-short -- frames --work W --video W/out/short.mp4 --at …`
   with one time inside each beat, Read the stills: caption readable and
   inside the frame, right footage, end card intact. Re-render at most once,
   only for a real problem — people will ask for changes in the next round.

9. **Report** — result.md in CI (see above), or a short summary locally.

## Gotchas

- edge-tts (the free voice) is Microsoft's read-aloud service, used
  unofficially; 7.2.x started failing with HTTP 403 in October 2026 and
  7.3.1 fixed it. If the voice step fails, say so in result.md — a person
  must bump the pin in `make-short.yml`.
- Landscape photos/clips sit on a blurred copy of themselves; upright ones
  fill the frame. Website recordings are already 1080 × 1920.
- Nothing here commits, pushes or posts to TikTok/YouTube; people upload.
