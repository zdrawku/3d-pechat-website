---
name: make-short
description: Render a 15–20 s vertical short (TikTok, YouTube Shorts, Reels) for a 3dpechat.bg catalog product from its catalog photos plus any photos/clips the user gives (local files or the shared Google Drive folder). Drafts the Bulgarian captions and voiceover for approval, checks them against business.json, renders short.mp4 + cover.jpg + post.txt into shorts/<linkId>/. Use when the user says "/make-short", "make a short", "направи кратко видео", or asks for a TikTok/Shorts/Reels video of a product.
---

# Make a short for a product

Format approved 2026-10-23 (FEATURE-IDEAS-PLAN.md, Idea 8, artifact
„Shorts Format Variants“): **A — product reveal**. Three beats from the
product's photos and clips (clips first), word-pop captions, then the paper
end card. 1080 × 1920, 15–20 s, Bulgarian voice `bg-BG-KalinaNeural`
(or `BorislavNeural`, or none). The same pipeline runs from a phone through
the `🎬 Ново кратко видео` issue form (`.github/workflows/make-short.yml`).

## Inputs

1. **The product** — linkId or name from `src/data/products.json`. Ask if unclear.
2. **Extra photos/clips (optional)** — pasted files, a folder, or the product's
   folder in the shared Drive. With Google Drive for desktop the Drive folder
   is a local path such as `G:\My Drive\3dpechat-shorts\<linkId>\` — ask the
   user for theirs once. Clips are the most valuable input.
3. **An idea/angle (optional)** and the voice (default Калина; „без глас“ = music only).
4. **Music (optional)** — a file the user picks, e.g. from the Drive `_music`
   folder. Never use a track of unknown origin.

## Steps

1. **Prepare** — copies nothing out of the repo; probes clips and writes previews:
   ```bash
   npm run make-short -- prepare --product <linkId> --media "<file or folder>" [--media …]
   ```
   Work files go to `tmp/make-short/<linkId>/` (gitignored).

2. **Look at every preview it lists** (Read each JPEG). Clip frames are named
   `m2-4s.jpg` = clip m2 at 4 s. Pick the best 2–4 s of each clip.

3. **Write `tmp/make-short/<linkId>/spec.json`** yourself (no API key needed):
   ```json
   {
     "voice": "bg-BG-KalinaNeural",
     "beats": [
       { "source": "m2", "start": 4, "caption": "Къде държите евромонетите?", "highlight": "евромонетите?", "voiceover": "Къде държите евромонетите?" },
       { "source": "m3", "start": 0, "caption": "…", "highlight": "…", "voiceover": "…" },
       { "source": "m1", "start": 0, "caption": "…", "highlight": "…", "voiceover": "…" }
     ],
     "endCard": { "line": "Отпечатан на 3D принтер в София", "voiceover": "Отпечатан на 3D принтер в София. 3dpechat.bg." },
     "post": { "title": "…", "description": "… Безплатна оферта на 3dpechat.bg", "hashtags": ["#3dпечат", "#3dprinting", "…"] }
   }
   ```
   Rules (the same ones the CI prompt in `draft.js` gives Claude):
   - 3 beats; open with a clip when there is one; photos fill the rest.
   - caption ≤ 6 words / 40 chars, no emoji; `highlight` = 1–2 words copied
     exactly from the caption (shown in orange).
   - voiceover: one sentence ≤ 12 words, or `""` for every line when the voice is off (`"voice": null`).
   - Say only what the frames show or the product text states. Numbers only
     from `business.json` facts or the product text; euro only; nothing from
     `neverClaim` (no SLA/resin, scanning, same-day, invoices, fixed modeling prices).
   - With an `ANTHROPIC_API_KEY`, `npm run make-short -- draft --product <linkId> [--idea "…"]`
     writes the spec through the API instead.

4. **Check it:** `npm run make-short -- check --product <linkId>`. Fix and
   re-check until it passes. A number that *is* in the facts can still be
   used wrongly — read every line yourself.

5. **Show the user the storyboard** (beats, voice lines, end card, post text)
   in Bulgarian and wait for approval. Apply their edits to `spec.json`.

6. **Render:** `npm run make-short -- render --product <linkId> [--music "<file>"]`
   → `shorts/<linkId>/short.mp4`, `cover.jpg`, `post.txt` (gitignored).
   Needs ffmpeg, Python with `edge-tts==7.3.1` (`python -m pip install --user edge-tts==7.3.1`)
   and Playwright's Chromium. About 30 s per short.

7. **Look at the result:** pull a frame from each beat
   (`ffmpeg -ss <t> -i short.mp4 -frames:v 1 frame.jpg`) and Read them —
   caption inside the frame, nothing cut off, end card intact. Offer to copy
   the files into the product's Drive folder under `_shorts/` so Maria sees them.

8. The user uploads to TikTok, YouTube Shorts and Reels by hand, pasting `post.txt`.

## Gotchas

- **edge-tts is Microsoft's free read-aloud service, used unofficially.** It
  broke in October 2026 (7.2.x → HTTP 403; fixed in 7.3.1). If the voice step
  fails, try the newest edge-tts and update the pin in `make-short.yml` too.
- Captions sit between 54 % and ~75 % of the height and away from the right
  edge, clear of the TikTok/Shorts buttons. Keep them short so they stay there.
- Landscape photos and clips are shown on a blurred copy of themselves rather
  than cropped; upright (9:16-ish) ones fill the frame.
- Nothing here commits, pushes or posts anything.
