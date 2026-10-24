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
     "post": { "title": "…", "description": "… Безплатна оферта на 3dpechat.bg", "hashtags": ["#3dпечат", "#3dprinting", "…"] }
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
   - post: title ≤ 70 chars; description ends with „Безплатна оферта на 3dpechat.bg“; 5–8 hashtags incl. #3dпечат and #3dprinting.

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
