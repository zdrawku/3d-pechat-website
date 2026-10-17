# Legacy redirects

GitHub Pages cannot send server-side redirects, so every renamed or merged URL is
a prerendered stub (`LegacyRedirectComponent`, routed in `src/app/app.routes.ts`
with `data: { to }`). Each stub contains a zero-delay
`<meta http-equiv="refresh">`, a `<link rel="canonical">` pointing at the target,
and a visible link; in the browser the router also navigates (`replaceUrl`).
Google treats a zero-delay meta refresh as a permanent redirect.

The slash-less old URL first gets GitHub's own 301 to the slash form, so each
entry below is a two-hop chain: `301` → meta refresh.

**Never delete these routes** — they exist to carry the old URLs' ranking and
inbound links to the new pages. Add new rows when you rename or merge a post.

| Old URL | New URL | Reason | Date |
|---|---|---|---|
| `https://3dpechat.bg/blog/how-to-make-money-3d-printing/` | `https://3dpechat.bg/blog/kak-da-pechelim-ot-3d-printiraneto/` | Merged: unique licensing, GPSR/CE and pricing material folded into the kept post | 2026-10-12 |
| `https://3dpechat.bg/blog/prozrachen-i-poluprozrachen-pla-filament-kak-da-postignete-svetlopropuskliv-3d-p/` | `https://3dpechat.bg/blog/prozrachen-i-poluprozrachen-pla-filament-svetlopropuskliv-3d-pechat/` | Renamed: the old slug was cut mid-word (`…-3d-p`) | 2026-10-12 |

## Search Console checklist

1. Request indexing for both **new** URLs (URL Inspection → Request indexing).
2. Resubmit `https://3dpechat.bg/sitemap.xml` — it lists only the new URLs.
3. Inspect each **old** URL once: it should report the redirect and the new URL as the Google-selected canonical. (Allow days to weeks.)
4. Watch Pages → "Page with redirect" for the two old URLs: expected, not an error.
