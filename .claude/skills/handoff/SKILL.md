---
name: handoff
description: Close a change set on 3dpechat.bg with a detailed test plan for exactly the files that changed and a "What's next" list of steps to run once the change is live (deploy checks, Search Console, Bing/IndexNow, Analytics, visual baselines). Use at the end of EVERY task that changed files, before the final summary — and whenever the user asks for a test plan, a handoff, a release checklist, "what's next" or "what do I do after deploy".
---

# Handoff: test plan + what's next

Every change set ends with two sections in the final message, written for the
owner, who reviews, commits, merges and deploys himself:

1. **Test plan** — what was verified, how, and with what result, plus what he
   should still check by hand, for **exactly the areas the change touched**.
2. **What's next (once it's live)** — the ordered steps after the deploy, each
   with who does it (him / automatic) and when (right after deploy, in a week…).

## Steps

### 1. Get the checklist for the changed files

```
node scripts/handoff-checklist.js            # vs origin/main, plus uncommitted + untracked
node scripts/handoff-checklist.js --base <ref>
```

It groups the changed files into areas (blog, translations, business facts,
catalogue, UI, routes, SEO, auto-blog pipeline, scripts, CI, analytics), names
the public pages affected in every language, and lists per area the automated
checks, the checks by hand and the post-live steps. Areas and their checks live
in `AREAS` in [`scripts/handoff-checklist.js`](../../../scripts/handoff-checklist.js) —
when a new kind of file or a new check appears, add it there (and to its test).

### 2. Run the automated checks it lists

At least what CLAUDE.md "Verify before claiming done" requires: `npm run build`,
`npm test -- --watch=false --browsers=ChromeHeadless`, `npm run test:scripts`
when `scripts/` changed, the Playwright suite and screenshots for UI changes.
Record the numbers (tests passed, pages prerendered, bundle size when it moved)
and report failures with their output — never tick a box you didn't run.

### 3. Write the two sections

**Test plan** — one block per area the checklist found:
- *Verified:* each check that ran, with its result (`293/293 unit tests`,
  `40 pages prerendered`, `207 e2e passed`, "screenshots light/dark × desktop/phone of /en/blog/").
- *Check by hand:* the specific things a person should look at — with the exact
  URLs (both languages), the control or text to look at, and what "right"
  looks like. Not "test the page": "open /en/products/#variant-1 on a phone;
  the card scrolls into view and both images flip".
- Files the checklist couldn't place ("Other files"): say what you verified.

**What's next (once it's live)** — numbered, in the order to do them:
- Always: `npm run check:live` after the deploy.
- From the checklist's areas: IndexNow in the deploy log; Search Console
  (URL inspection → Request indexing for new URLs; resubmit `sitemap.xml` when
  the URL set changed; Pages report in 1–2 weeks); Visual regression „update
  baselines“ after an intentional visual change; GA4 DebugView / key events
  for analytics changes; Google Business Profile when business facts changed;
  the next auto-blog run for pipeline changes.
- Anything time-sensitive gets a date (e.g. "before the auto-blog run on the 21st, 09:00 UTC").
- Anything that only the owner can do (merging, workflow runs, Search Console,
  GA, Business Profile) is marked as his.

Keep both sections specific to this change — skip areas it didn't touch, and
don't pad with generic advice. A large change set also gets the "why so many
files" map (files grouped by why they changed, and how they could be split
into commits).
