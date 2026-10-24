/**
 * The `🎬 Ново кратко видео` issue flow, run by .github/workflows/make-short.yml
 * after the author/commenter passed scripts/check-issue-author.js.
 *
 *   node scripts/make-short/from-issue.js draft   — issue opened, or `/redo <note>`
 *   node scripts/make-short/from-issue.js render  — `/render`
 *
 * draft: downloads the issue's photos/clips (and the product's Drive folder
 * when ticked), asks Claude for a storyboard, and comments it for approval
 * with the spec embedded. render: takes the newest bot comment's spec, renders
 * the short, attaches it to the `shorts-drafts` pre-release and comments the
 * links. Nothing is committed and nothing is posted to TikTok or YouTube.
 *
 * Env: ISSUE_NUMBER, ISSUE_BODY, REPO (owner/name), GITHUB_TOKEN,
 *      ANTHROPIC_API_KEY (draft), COMMENT_BODY (redo note),
 *      GDRIVE_SA_KEY + GDRIVE_FOLDER_ID (optional), RUN_URL (optional)
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const lib = require('./lib');
const media = require('./media');
const drive = require('./drive');
const { collect } = require('./collect');

const RELEASE = 'shorts-drafts';
const { ISSUE_NUMBER, REPO } = process.env;
const WORK = path.join(lib.ROOT, 'tmp', 'make-short', `issue-${ISSUE_NUMBER}`);

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
  return res.json();
}

const comment = (body) => github(`/issues/${ISSUE_NUMBER}/comments`, { method: 'POST', body: { body } });

/** Where each media item came from, in words for the comment. */
function describe(m) {
  if (m.origin === 'catalog') return m.name;
  const where = m.origin === 'drive' ? 'Drive' : 'issue';
  return m.kind === 'video' ? `клип ${m.name} (${where})` : `снимка ${m.name} (${where})`;
}

function storyboardComment(spec, product, warnings, problems) {
  const beat = (b, i) => {
    const m = spec.media[b.source];
    const src = m.kind === 'video' ? `${describe(m)}, от ${b.start} s` : describe(m);
    return `${i + 1}. **${b.caption}**${b.voiceover ? `\n   🔊 ${b.voiceover}` : ''}\n   <sub>${src}</sub>`;
  };
  return [
    `### Чернова за **${product.name}**`,
    '',
    ...spec.beats.map(beat),
    `${spec.beats.length + 1}. **3dpechat.bg · ${spec.endCard.line}**${spec.endCard.voiceover ? `\n   🔊 ${spec.endCard.voiceover}` : ''}\n   <sub>финален кадър</sub>`,
    '',
    `**Глас:** ${spec.voice || 'без глас, само музика'}`,
    '',
    '<details><summary>Текст за публикуване</summary>',
    '',
    '```',
    lib.postText(spec).trim(),
    '```',
    '</details>',
    '',
    ...(warnings.length ? ['**Бележки:**', ...warnings.map((w) => `- ${w}`), ''] : []),
    ...(problems.length
      ? ['⚠️ **Черновата не мина проверката на фактите** и няма да бъде направена:', ...problems.map((p) => `- ${p}`), '', 'Отговори с `/redo` и бележка какво да промени.']
      : ['Отговори с `/render`, за да направя видеото, или с `/redo` и бележка за нова чернова.']),
    '',
    // Every draft is marked, so /render always acts on the newest one — a
    // draft that failed its checks carries no spec and blocks rendering.
    DRAFT_MARKER,
    problems.length ? '' : lib.embedSpec(spec),
  ].join('\n');
}

const DRAFT_MARKER = '<!-- make-short-draft -->';

/** Photos and clips from the issue and (if ticked) the product's Drive folder. */
async function gatherExtras(request, dir) {
  const warnings = [];
  const extras = [];
  fs.mkdirSync(dir, { recursive: true });

  for (const [i, url] of request.attachmentUrls.entries()) {
    try {
      const file = await media.downloadAttachment(url, dir, `issue-${i + 1}`);
      extras.push({ origin: 'issue', ref: url, name: `файл ${i + 1}`, file });
    } catch (err) {
      warnings.push(`Не успях да изтегля файл ${i + 1} от issue-то: ${err.message}`);
    }
  }

  if (request.useDrive && !drive.configured()) {
    warnings.push('Google Drive още не е свързан (липсват GDRIVE_SA_KEY / GDRIVE_FOLDER_ID), затова използвах само файловете от issue-то и каталога.');
  } else if (request.useDrive) {
    const token = await drive.accessToken(process.env.GDRIVE_SA_KEY);
    const { files, folderName } = await drive.productMedia(token, process.env.GDRIVE_FOLDER_ID, request.product);
    if (!folderName) warnings.push(`В Drive няма папка „${request.product.linkId}“ (или „${request.product.name}“), затова не взех нищо оттам.`);
    for (const f of files) {
      const file = path.join(dir, `drive-${f.id}${path.extname(f.name).toLowerCase()}`);
      await drive.download(token, f.id, file);
      extras.push({ origin: 'drive', ref: f.id, name: f.name, file });
    }
  }
  // Clips first: the short opens with movement when there is any.
  extras.sort((a, b) => (media.kindOf(a.file) === 'video' ? 0 : 1) - (media.kindOf(b.file) === 'video' ? 0 : 1));
  return { extras, warnings };
}

async function draft() {
  // An issue created from the form can fire both `opened` and `labeled`;
  // only `/redo` may draft again once a draft exists.
  if (process.env.EVENT_NAME === 'issues') {
    const comments = await github(`/issues/${ISSUE_NUMBER}/comments?per_page=100`);
    if (comments.some((c) => c.user && c.user.login === 'github-actions[bot]' && c.body.includes(DRAFT_MARKER))) {
      console.log('A draft already exists for this issue — nothing to do.');
      return;
    }
  }
  const request = lib.parseShortIssue(process.env.ISSUE_BODY, lib.readProducts());
  if (request.errors.length) {
    await comment(`Не мога да започна:\n${request.errors.map((e) => `- ${e}`).join('\n')}\n\nОправи issue-то и напиши \`/redo\`.`);
    return;
  }
  const note = (lib.parseCommand(process.env.COMMENT_BODY || '') || {}).note || '';
  fs.rmSync(WORK, { recursive: true, force: true });
  const { extras, warnings } = await gatherExtras(request, path.join(WORK, 'files'));
  const manifest = await collect({ product: request.product, extras, workDir: WORK });

  const { draftSpec } = require('./draft');
  const { spec, problems } = await draftSpec({ product: request.product, manifest, idea: request.idea, note, voice: request.voice });
  await comment(storyboardComment(spec, request.product, [...warnings, ...manifest.warnings], problems));
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

async function render() {
  const comments = await github(`/issues/${ISSUE_NUMBER}/comments?per_page=100`);
  // Only the bot's own comments count — a person can't paste in a spec.
  const latest = comments.reverse().find((c) => c.user && c.user.login === 'github-actions[bot]' && c.body.includes(DRAFT_MARKER));
  if (!latest || !lib.extractSpec(latest.body)) {
    await comment('Последната чернова не мина проверката (или още няма чернова), затова няма какво да направя. Напиши `/redo` и бележка за нова.');
    return;
  }
  const spec = lib.extractSpec(latest.body);
  const product = lib.findProduct(lib.readProducts(), spec.product);
  const problems = [...lib.validateSpec(spec), ...lib.factsCheck(lib.specTexts(spec), {
    facts: lib.readBusiness().facts, sources: [product.name, product.description, spec.idea],
  })];
  if (problems.length) throw new Error(`The stored storyboard fails its checks:\n${problems.join('\n')}`);

  // Fetch only the media the beats use, from where each one came from.
  const dir = path.join(WORK, 'files');
  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const token = drive.configured() ? await drive.accessToken(process.env.GDRIVE_SA_KEY) : null;
  const files = {};
  for (const id of new Set(spec.beats.map((b) => b.source))) {
    const m = spec.media[id];
    if (m.origin === 'catalog') {
      if (!/^src\/assets\/[\w./-]+$/.test(m.ref)) throw new Error(`Bad catalog path ${m.ref}`);
      files[id] = path.join(lib.ROOT, m.ref);
    } else if (m.origin === 'issue') {
      files[id] = await media.downloadAttachment(m.ref, dir, id);
    } else if (m.origin === 'drive' && token) {
      files[id] = await drive.download(token, m.ref, path.join(dir, `${id}${path.extname(m.name).toLowerCase()}`));
    } else {
      throw new Error(`Can't fetch ${id} (${m.origin}) — is Google Drive still connected?`);
    }
  }

  // Music from Drive `_music`, the same track for the same issue.
  let music;
  if (token) {
    const { music: tracks } = await drive.productMedia(token, process.env.GDRIVE_FOLDER_ID, product);
    if (tracks.length) {
      const track = tracks[Number(ISSUE_NUMBER) % tracks.length];
      music = await drive.download(token, track.id, path.join(dir, `music${path.extname(track.name).toLowerCase()}`));
    }
  }

  const { renderShort } = require('./render');
  const out = path.join(WORK, 'out');
  const result = await renderShort({ spec, files, outDir: out, workDir: path.join(WORK, 'render'), music });

  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  const base = `${product.linkId}-issue${ISSUE_NUMBER}-${stamp}`;
  const named = [['short.mp4', `${base}.mp4`], ['cover.jpg', `${base}.jpg`]].map(([from, to]) => {
    const dest = path.join(out, to);
    fs.renameSync(path.join(out, from), dest);
    return dest;
  });
  const [videoUrl, coverUrl] = upload(named);

  await comment([
    `### Готово: ${product.name} (${result.seconds} s, 1080 × 1920)`,
    '',
    `▶️ **[Гледай или свали видеото](${videoUrl})**${music ? '' : ' · без музика (в Drive няма папка `_music`)'}`,
    '',
    `[![Корица](${coverUrl})](${videoUrl})`,
    '',
    '**Текст за публикуване** (TikTok, YouTube Shorts, Reels):',
    '```',
    fs.readFileSync(result.post, 'utf8').trim(),
    '```',
    '',
    'Качи го ръчно и затвори issue-то. За промени напиши `/redo` и бележка.',
  ].join('\n'));
}

const mode = process.argv[2];
(mode === 'render' ? render : draft)().catch(async (err) => {
  console.error('[make-short] FAILED:', (err && err.stack) || err);
  try {
    await comment(`Нещо се обърка: ${String(err.message).split('\n')[0]}${process.env.RUN_URL ? `\n\nЛогът: ${process.env.RUN_URL}` : ''}`);
  } catch {
    // The workflow log still has the error.
  }
  process.exit(1);
});
