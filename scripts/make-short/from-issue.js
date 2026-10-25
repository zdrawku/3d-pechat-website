/**
 * The GitHub side of the `🎬 Ново кратко видео` flow, around the agent run in
 * .github/workflows/make-short.yml. The agent itself never gets a GitHub
 * token: this script hands it files and posts its answer.
 *
 *   node scripts/make-short/from-issue.js prepare   before the agent
 *   node scripts/make-short/from-issue.js publish   after the agent
 *
 * prepare → tmp/make-short/issue-<n>/
 *   request.md   the request, the whole conversation, the files and what the
 *                previous run made — the agent starts here
 *   uploads/     every photo/clip from the issue and from the team's comments
 *   previous/    spec.json and flows/*.json of the last version, if any
 * publish ← result.md (the agent's message, Bulgarian) and out/ (the short):
 *   uploads the video and cover to the `shorts-drafts` pre-release and
 *   comments the message, the links, the post text and the state for the next
 *   round.
 *
 * Env: ISSUE_NUMBER, REPO (owner/name), GITHUB_TOKEN, RUN_URL (optional),
 *      TRIGGER_COMMENT_ID (when a comment started the run)
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const lib = require('./lib');
const media = require('./media');
const { readAuthors, findAuthor } = require('../check-issue-author');
const { RUN_MARKER } = require('./limits');

const RELEASE = 'shorts-drafts';
const BOT = 'github-actions[bot]';
const { ISSUE_NUMBER, REPO } = process.env;
const WORK = path.join(lib.ROOT, 'tmp', 'make-short', `issue-${ISSUE_NUMBER}`);
const rel = (p) => path.relative(lib.ROOT, p).replace(/\\/g, '/');

async function github(pathname, { method = 'GET', body } = {}) {
  const res = await fetch(`https://api.github.com/repos/${REPO}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': '3dpechat-make-short',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`GitHub ${method} ${pathname}: HTTP ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

const comment = (body) => github(`/issues/${ISSUE_NUMBER}/comments`, { method: 'POST', body: { body } });

/** Text of a message without attachment markup and the bot's hidden state. */
function readable(text) {
  return String(text || '')
    .replace(new RegExp(`<!-- ${lib.STATE_MARKER}[\\s\\S]*?-->`, 'g'), '')
    .replace(/<img\b[^>]*>/gi, '[снимка]')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '[снимка]')
    .replace(/^https:\/\/github\.com\/user-attachments\/\S+$/gm, '[файл]')
    .trim();
}

/**
 * The messages that matter, in order: the issue, the team's comments and the
 * bot's replies. Comments starting with `//` are notes between people and are
 * left out; so is anyone outside the allowlist. People appear as „екипът“ —
 * the agent needs what was asked, not who asked it.
 */
function conversation(issue, comments, authors) {
  const messages = [{ who: 'екипът', at: issue.created_at, body: issue.body, isRequest: true }];
  for (const c of comments) {
    const fromBot = c.user && c.user.login === BOT;
    const fromTeam = c.user && findAuthor(authors, c.user.id);
    if (!fromBot && !fromTeam) continue;
    if (!fromBot && c.body.trim().startsWith('//')) continue;
    messages.push({ who: fromBot ? 'агентът' : 'екипът', at: c.created_at, body: c.body, fromBot });
  }
  return messages;
}

/** request.md: what the agent reads first. */
function requestMarkdown({ request, messages, files, previous }) {
  const lines = [
    `# Заявка за кратко видео — issue #${ISSUE_NUMBER}`,
    '',
    '## Какво искат',
    '',
    request,
    '',
  ];
  const rest = messages.slice(1);
  if (rest.length) {
    lines.push('## Разговор досега (най-новото е последно — то е важното)', '');
    for (const m of rest) lines.push(`### ${m.who} · ${m.at.slice(0, 16).replace('T', ' ')}`, '', readable(m.body) || '(само файлове)', '');
  }
  lines.push('## Качени файлове', '');
  if (files.length) for (const f of files) lines.push(`- \`${rel(f.file)}\` — ${f.from}`);
  else lines.push('- (няма — използвай снимки от каталога или запис на сайта)');
  lines.push('');
  if (previous) {
    lines.push('## Предишната версия', '', `Сценарият и записите на сайта ѝ са в \`${rel(path.join(WORK, 'previous'))}/\`. Промени само това, което поискаха в последния коментар.`, '');
  }
  return lines.join('\n');
}

async function react() {
  const target = process.env.TRIGGER_COMMENT_ID ? `/issues/comments/${process.env.TRIGGER_COMMENT_ID}/reactions` : `/issues/${ISSUE_NUMBER}/reactions`;
  await github(target, { method: 'POST', body: { content: 'eyes' } }).catch(() => {});
}

async function prepare() {
  await react();
  const authors = readAuthors();
  const issue = await github(`/issues/${ISSUE_NUMBER}`);
  // Second lock behind the workflow's gate: the request text goes to the
  // agent, so it must come from the team.
  if (!findAuthor(authors, issue.user && issue.user.id)) {
    throw new Error(`Issue #${ISSUE_NUMBER} was opened by ${issue.user && issue.user.login}, who is not in .github/issue-authors.json — refusing to run.`);
  }
  const comments = await github(`/issues/${ISSUE_NUMBER}/comments?per_page=100`);
  const messages = conversation(issue, comments, authors);
  const { request } = lib.parseShortIssue(issue.body);

  fs.rmSync(WORK, { recursive: true, force: true });
  const uploads = path.join(WORK, 'uploads');
  fs.mkdirSync(uploads, { recursive: true });
  // The agent writes here with its Write tool; it has no shell to mkdir.
  fs.mkdirSync(path.join(WORK, 'flows'), { recursive: true });

  // Files from the request and from the team's comments (never the bot's).
  const files = [];
  const problems = [];
  let n = 0;
  for (const [i, m] of messages.entries()) {
    if (m.fromBot) continue;
    for (const url of lib.extractAttachmentUrls(m.body)) {
      n += 1;
      try {
        const file = await media.downloadAttachment(url, uploads, `${String(n).padStart(2, '0')}-${i === 0 ? 'zayavka' : `komentar${i}`}`);
        files.push({ file, from: i === 0 ? 'от заявката' : `от коментар (${m.at.slice(0, 10)})` });
      } catch (err) {
        problems.push(`Не успях да изтегля файл ${n}: ${err.message}`);
      }
    }
  }

  // The last version, so feedback changes it instead of starting over.
  const lastBot = [...comments].reverse().find((c) => c.user && c.user.login === BOT && lib.extractState(c.body));
  const previous = lastBot ? lib.extractState(lastBot.body) : null;
  if (previous) {
    const dir = path.join(WORK, 'previous');
    fs.mkdirSync(path.join(dir, 'flows'), { recursive: true });
    if (previous.spec) fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(previous.spec, null, 2));
    for (const [name, flow] of Object.entries(previous.flows || {})) fs.writeFileSync(path.join(dir, 'flows', `${name}.json`), JSON.stringify(flow, null, 2));
  }

  fs.writeFileSync(path.join(WORK, 'request.md'), requestMarkdown({ request, messages, files, previous }) + (problems.length ? `\n## Проблеми при изтеглянето\n\n${problems.map((p) => `- ${p}`).join('\n')}\n` : ''));
  console.log(fs.readFileSync(path.join(WORK, 'request.md'), 'utf8'));
}

/** Makes sure the pre-release exists, then uploads (replacing same-named files). */
function upload(files) {
  const gh = (args) => execFileSync('gh', [...args, '--repo', REPO], { stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    gh(['release', 'view', RELEASE]);
  } catch {
    gh(['release', 'create', RELEASE, '--prerelease', '--title', 'Shorts drafts',
      '--notes', 'Чернови на кратки видеа от issue-тата „🎬 Ново кратко видео“. Не е версия на сайта.']);
  }
  gh(['release', 'upload', RELEASE, ...files, '--clobber']);
  return files.map((f) => `https://github.com/${REPO}/releases/download/${RELEASE}/${encodeURIComponent(path.basename(f))}`);
}

/**
 * The upload copy as one code block per field — GitHub gives every code block
 * a copy button, so on a phone each field is one tap to copy.
 */
function uploadSection(c) {
  const block = (text) => ['```text', text, '```'];
  return [
    '### 📋 Текст за качване',
    '',
    '**TikTok** (и Instagram Reels) — описание:',
    ...block(c.tiktok),
    '',
    '**YouTube Shorts** — заглавие:',
    ...block(c.youtubeTitle),
    'описание:',
    ...block(c.youtubeDescription),
    'тагове:',
    ...block(c.youtubeTags),
    '',
    '**Закачен коментар** — напиши го първи и го закачи:',
    ...block(c.pinnedComment),
    '',
    '<details><summary>Линк за TikTok био или сторис</summary>', '', ...block(c.siteLink), '</details>',
    '',
    '🔊 _Видеото е без звук: при качване добави популярен звук от библиотеката на TikTok / YouTube — така видеото стига и до хората, които следят този звук._',
    '',
    '_Отговаряй на коментарите през първия час — тогава платформите решават дали да покажат видеото на повече хора._',
  ].join('\n');
}

/** The spec and recording scripts of this version, for the next round. */
function currentState() {
  const specFile = path.join(WORK, 'spec.json');
  const flowsDir = path.join(WORK, 'flows');
  const flows = fs.existsSync(flowsDir)
    ? Object.fromEntries(fs.readdirSync(flowsDir).filter((f) => f.endsWith('.json')).map((f) => [path.basename(f, '.json'), JSON.parse(fs.readFileSync(path.join(flowsDir, f), 'utf8'))]))
    : {};
  return fs.existsSync(specFile) ? lib.nextRoundState(JSON.parse(fs.readFileSync(specFile, 'utf8')), flows) : null;
}

/**
 * The state is carried to the next round only when everything in it could be
 * public (it sits base64-encoded in a public comment): captions, upload copy
 * and typed text all pass the same check as the video.
 */
function publishableState(state, email) {
  if (!state) return null;
  const typed = Object.values(state.flows).flatMap((f) => (f.steps || []).filter((s) => s && s.type).map((s) => s.type.text));
  const problems = lib.scopeCheck([...lib.specTexts(state.spec), ...typed], { email });
  if (problems.length) console.log(`State not saved for the next round (${problems.length} text(s) failed the public-text check).`);
  return problems.length ? null : state;
}

async function publish() {
  const { email } = lib.readBusiness();
  const resultFile = path.join(WORK, 'result.md');
  const raw = fs.existsSync(resultFile) ? fs.readFileSync(resultFile, 'utf8') : '';
  const { text: message, withheld } = lib.publicMessage(raw, { email });
  // The log is public too: name the reasons, never the text.
  if (withheld.length) console.log(`result.md replaced by the neutral line (${withheld.join('; ')}).`);
  const run = lastResult();
  if (run) console.log(`Agent: ${run.subtype}, ${run.num_turns} turns, ${Math.round((run.duration_ms || 0) / 1000)} s.`);
  const out = path.join(WORK, 'out');
  const video = path.join(out, 'short.mp4');
  const started = Number(process.env.RUN_STARTED_MS || 0);
  const fresh = fs.existsSync(video) && fs.statSync(video).mtimeMs >= started;

  const stoppedBy = capReached();
  if (!message && !fresh && !stoppedBy) throw new Error('The agent finished without a video or a message (no result.md).');

  const parts = [];
  if (fresh) {
    const seconds = Math.round(media.probe(video).duration * 10) / 10;
    const base = `issue${ISSUE_NUMBER}-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}`;
    const named = [['short.mp4', `${base}.mp4`], ['cover.jpg', `${base}.jpg`]]
      .filter(([from]) => fs.existsSync(path.join(out, from)))
      .map(([from, to]) => {
        const dest = path.join(out, to);
        fs.copyFileSync(path.join(out, from), dest);
        return dest;
      });
    const [videoUrl, coverUrl] = upload(named);
    parts.push(`### 🎬 Готово (${seconds} s, 1080 × 1920)`, '', `▶️ **[Гледай или свали видеото](${videoUrl})**`, '');
    if (coverUrl) parts.push(`[![Корица](${coverUrl})](${videoUrl})`, '');
  }
  if (message) parts.push(message, '');
  const state = publishableState(currentState(), email);
  if (fresh && state && !lib.validatePost(state.spec.post).length) {
    parts.push(uploadSection(lib.uploadCopy(state.spec, `short-issue-${ISSUE_NUMBER}`)), '');
  }
  if (stoppedBy) {
    parts.push(`⏹️ **Спрях по лимит: ${stoppedBy}.** ${fresh ? 'Видеото по-горе е последното, което успях да направя.' : 'Не стигнах до готово видео.'} Опрости заявката (по-малко кадри, по-кратък запис) или напиши коментар, за да продължа.`, '');
  }
  parts.push('_За промени просто напиши коментар. Коментар, който започва с `//`, е бележка и не пуска нова версия._', RUN_MARKER);
  if (state) parts.push('', lib.embedState(state));
  await comment(parts.join('\n'));
}

/** The CLI's final `result` line from the transcript (TRANSCRIPT), or null. */
function lastResult() {
  const file = process.env.TRANSCRIPT;
  if (!file || !fs.existsSync(file)) return null;
  const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
  try {
    const last = JSON.parse(lines[lines.length - 1]);
    return last.type === 'result' ? last : null;
  } catch {
    return null;
  }
}

/**
 * Which cap stopped the agent, in words, or '' when it finished normally.
 * Reads the transcript's result and the `.stopped` file the workflow writes
 * when its `timeout` killed the agent. Worded for the public issue: no
 * accounts, money or tools.
 */
function capReached() {
  const subtype = (lastResult() || {}).subtype || '';
  if (subtype === 'error_max_budget_usd') return 'заявката стана твърде голяма за един път';
  if (subtype === 'error_max_turns') return 'стигнах максималния брой стъпки';
  if (fs.existsSync(path.join(WORK, '.stopped'))) return 'изтече времето за една заявка';
  return '';
}

async function fail() {
  await comment(`Нещо се обърка и видеото не стана.${process.env.RUN_URL ? ` Логът: ${process.env.RUN_URL}` : ''}\n\nНапиши коментар, за да опитам пак.\n\n${RUN_MARKER}`);
}

const modes = { prepare, publish, fail };
const mode = modes[process.argv[2]];
if (require.main === module) {
  if (!mode) {
    console.error('Usage: from-issue.js prepare|publish|fail');
    process.exit(1);
  }
  mode().catch((err) => {
    console.error('[make-short] FAILED:', (err && err.stack) || err);
    process.exit(1);
  });
}

module.exports = { conversation, readable, requestMarkdown, uploadSection, capReached, publishableState };
