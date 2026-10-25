/**
 * Tells a `📦 Нов продукт` issue that its product is on the site. Run by
 * `.github/workflows/product-live.yml` after every GitHub Pages deploy.
 *
 * For each product PR (branch `add-product/<linkId>`) merged in the last day
 * whose issue hasn't had the link yet: waits until
 * https://3dpechat.bg/products/ contains the product (the Pages CDN can lag
 * a few minutes), then comments the link on the issue. A product that isn't
 * visible yet is tried again after the next deploy. (The issue itself is
 * closed by the PR's `Closes #N` when it is merged.)
 *
 * Env: GITHUB_TOKEN, REPO (owner/name)
 */
const SITE = 'https://3dpechat.bg';
const BOT = 'github-actions[bot]';
const MARKER = '<!-- product-live -->';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const WAIT_MS = 10 * 60 * 1000;
const POLL_MS = 30 * 1000;

/** The product's linkId from its PR branch, or null for any other PR. */
function linkIdOf(pr) {
  const m = /^add-product\/([a-z0-9-]+)$/.exec((pr.head && pr.head.ref) || '');
  return m ? m[1] : null;
}

/** The issue the PR came from („Нов продукт от issue #61“), or null. */
function issueOf(pr) {
  const m = /Нов продукт от issue #(\d+)/.exec(pr.body || '');
  return m ? Number(m[1]) : null;
}

/** Product PRs merged recently enough to announce. Pure, for the tests. */
function toAnnounce(prs, now = Date.now()) {
  return prs
    .filter((pr) => pr.merged_at && now - Date.parse(pr.merged_at) < MAX_AGE_MS)
    .map((pr) => ({ pr: pr.number, linkId: linkIdOf(pr), issue: issueOf(pr), name: String(pr.title || '').replace(/^📦 Нов продукт:\s*/, '') }))
    .filter((p) => p.linkId && p.issue);
}

const productUrl = (linkId) => `${SITE}/products/#${linkId}`;

const liveComment = (p) => `🟢 Продуктът вече е на сайта: **[${p.name}](${productUrl(p.linkId)})**\n\n${MARKER}`;

async function github(pathname, { method = 'GET', body } = {}) {
  const res = await fetch(`https://api.github.com/repos/${process.env.REPO}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': '3dpechat-product-live',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`GitHub ${method} ${pathname}: HTTP ${res.status}`);
  return res.json();
}

/** True once the live products page mentions the product (its images carry the linkId). */
async function isLive(linkId) {
  const deadline = Date.now() + WAIT_MS;
  for (;;) {
    const res = await fetch(`${SITE}/products/?live=${Date.now()}`).catch(() => null);
    if (res && res.ok && (await res.text()).includes(linkId)) return true;
    if (Date.now() + POLL_MS > deadline) return false;
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}

async function main() {
  const prs = await github('/pulls?state=closed&sort=updated&direction=desc&per_page=50');
  for (const p of toAnnounce(prs)) {
    const issue = await github(`/issues/${p.issue}`);
    if (!issue.labels.some((l) => l.name === 'new-product')) continue;
    const comments = await github(`/issues/${p.issue}/comments?per_page=100`);
    if (comments.some((c) => c.user && c.user.login === BOT && String(c.body).includes(MARKER))) continue;
    if (!(await isLive(p.linkId))) {
      console.log(`#${p.issue}: ${p.linkId} isn't on ${SITE}/products/ yet — the next deploy tries again.`);
      continue;
    }
    await github(`/issues/${p.issue}/comments`, { method: 'POST', body: { body: liveComment(p) } });
    console.log(`#${p.issue}: linked ${productUrl(p.linkId)} (PR #${p.pr}).`);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`[product-live] ${err.message}`);
    process.exit(1);
  });
}

module.exports = { linkIdOf, issueOf, toAnnounce, liveComment, productUrl, MARKER };
