/**
 * Usage limits for the shorts agent, checked in the workflow's `gate` job
 * before anything expensive runs. Every agent run leaves a comment marked
 * RUN_MARKER (from-issue.js publish/fail), so counting those is enough:
 *
 *   SHORTS_MAX_VERSIONS — runs per issue (first version + feedback rounds)
 *   SHORTS_MAX_PER_DAY  — runs across all issues in the last 24 hours
 *
 * Over a limit: comments once on the issue and writes `over=true` to
 * $GITHUB_OUTPUT, so the agent job doesn't start. Needs only Node (no npm ci).
 *
 * Env: REPO, ISSUE_NUMBER, GITHUB_TOKEN, SHORTS_MAX_VERSIONS, SHORTS_MAX_PER_DAY
 */
const fs = require('fs');

const RUN_MARKER = '<!-- make-short-run -->';
const LIMIT_MARKER = '<!-- make-short-limit -->';
const BOT = 'github-actions[bot]';
const DAY_MS = 24 * 60 * 60 * 1000;

const isRun = (c) => c.user && c.user.login === BOT && String(c.body).includes(RUN_MARKER);

/** Which limit (if any) a new run would break. Pure, for the tests. */
function overLimit({ issueComments, recentComments, now = Date.now(), maxVersions, maxPerDay }) {
  const versions = issueComments.filter(isRun).length;
  const today = recentComments.filter((c) => isRun(c) && now - Date.parse(c.created_at) < DAY_MS).length;
  if (versions >= maxVersions) {
    return { over: true, reason: `Това issue вече има ${versions} версии (лимитът е ${maxVersions}). Отвори ново issue за нова идея.` };
  }
  if (today >= maxPerDay) {
    return { over: true, reason: `През последните 24 часа са направени ${today} видеа (лимитът е ${maxPerDay}). Напиши коментар утре и ще продължа оттук.` };
  }
  return { over: false, versions, today };
}

async function github(pathname, { method = 'GET', body } = {}) {
  const res = await fetch(`https://api.github.com/repos/${process.env.REPO}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': '3dpechat-make-short',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`GitHub ${method} ${pathname}: HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const issue = process.env.ISSUE_NUMBER;
  const maxVersions = Number(process.env.SHORTS_MAX_VERSIONS || 5);
  const maxPerDay = Number(process.env.SHORTS_MAX_PER_DAY || 15);
  const since = new Date(Date.now() - DAY_MS).toISOString();
  const issueComments = await github(`/issues/${issue}/comments?per_page=100`);
  const recentComments = await github(`/issues/comments?since=${since}&per_page=100`);
  const result = overLimit({ issueComments, recentComments, maxVersions, maxPerDay });

  if (result.over) {
    console.log(`Limit reached: ${result.reason}`);
    const last = [...issueComments].reverse().find((c) => c.user && c.user.login === BOT);
    if (!last || !String(last.body).includes(LIMIT_MARKER)) {
      await github(`/issues/${issue}/comments`, { method: 'POST', body: { body: `⏸️ ${result.reason}\n\n${LIMIT_MARKER}` } });
    }
  } else {
    console.log(`Within limits: ${result.versions}/${maxVersions} versions on this issue, ${result.today}/${maxPerDay} in the last 24 h.`);
  }
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `over=${result.over}\n`);
}

if (require.main === module) {
  main().catch((err) => {
    // Fail closed: if the limits can't be checked, don't start the agent.
    console.error(`[make-short limits] ${err.message}`);
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, 'over=true\n');
  });
}

module.exports = { overLimit, RUN_MARKER, LIMIT_MARKER };
