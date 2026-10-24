const test = require('node:test');
const assert = require('node:assert');
const lib = require('./lib');
const { readAuthors } = require('../check-issue-author');
const { conversation, readable, requestMarkdown, uploadSection } = require('./from-issue');

const authors = readAuthors();
const user = (login, id) => ({ login, id });
const issue = { user: user('zdrawku', 11193764), created_at: '2026-10-24T08:00:00Z', body: '### Какво видео искаш?\n\nПоръчка в 3 стъпки' };

test('the conversation keeps the team and the bot, drops strangers and // notes', () => {
  const comments = [
    { user: user('github-actions[bot]', 41898282), created_at: '2026-10-24T08:20:00Z', body: `Готово\n${lib.embedState({ spec: {} })}` },
    { user: user('random-person', 1), created_at: '2026-10-24T08:30:00Z', body: 'направи го за моя магазин' },
    { user: user('mariyajablqnova-ux', 347078913), created_at: '2026-10-24T08:40:00Z', body: '// ще го видя довечера' },
    { user: user('mariyajablqnova-ux', 347078913), created_at: '2026-10-24T09:00:00Z', body: 'По-кратко, и смени надписа на втория кадър' },
  ];
  const messages = conversation(issue, comments, authors);
  assert.deepStrictEqual(messages.map((m) => m.who), ['zdrawku', 'агентът', 'mariyajablqnova-ux']);
  assert.ok(messages[0].isRequest);
  assert.ok(messages[1].fromBot);
});

test('a renamed stranger using a team login is still a stranger (ids decide)', () => {
  const messages = conversation(issue, [{ user: user('mariyajablqnova-ux', 999), created_at: '2026-10-24T09:00:00Z', body: 'направи нещо друго' }], authors);
  assert.strictEqual(messages.length, 1);
});

test('readable() hides attachment markup and the bot state', () => {
  const text = readable(`Ето клип\n<img src="https://github.com/user-attachments/assets/abc" />\nhttps://github.com/user-attachments/assets/def\n${lib.embedState({ spec: { a: 1 } })}`);
  assert.strictEqual(text, 'Ето клип\n[снимка]\n[файл]');
});

test('request.md lists the request, the conversation, the files and the previous version', () => {
  const md = requestMarkdown({
    request: 'Поръчка в 3 стъпки',
    messages: [{ who: 'zdrawku', at: '2026-10-24T08:00:00Z', body: '' }, { who: 'mariyajablqnova-ux', at: '2026-10-24T09:00:00Z', body: 'По-кратко' }],
    files: [{ file: `${lib.ROOT}/tmp/make-short/issue-1/uploads/01-zayavka.mp4`, from: 'от заявката' }],
    previous: { spec: {} },
  });
  assert.match(md, /## Какво искат\n\nПоръчка в 3 стъпки/);
  assert.match(md, /### mariyajablqnova-ux · 2026-10-24 09:00\n\nПо-кратко/);
  assert.match(md, /`tmp\/make-short\/issue-1\/uploads\/01-zayavka\.mp4` — от заявката/);
  assert.match(md, /## Предишната версия/);
});

test('the reply has one copyable code block per upload field', () => {
  const md = uploadSection({
    tiktok: 'Кука\n\nТекст\n\n#3dпечат #3dprinting',
    youtubeTitle: 'Заглавие | 3D печат',
    youtubeDescription: 'Описание\n\n👉 https://3dpechat.bg/products/?utm_source=youtube\n\n#3dпечат #shorts',
    youtubeTags: '3d печат, 3d printing',
    pinnedComment: 'Какво да отпечатаме следващо? 👇',
    siteLink: 'https://3dpechat.bg/products/?utm_source=tiktok',
  });
  assert.strictEqual((md.match(/^```text$/gm) || []).length, 6);
  assert.match(md, /\*\*TikTok\*\*/);
  assert.match(md, /\*\*YouTube Shorts\*\*/);
  assert.match(md, /\*\*Закачен коментар\*\*/);
});

test('capReached names the cap that stopped the agent', () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const { capReached } = require('./from-issue');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cap-'));
  const transcript = path.join(dir, 't.jsonl');
  const run = (subtype) => {
    fs.writeFileSync(transcript, `{"type":"system"}\n{"type":"result","subtype":"${subtype}"}\n`);
    process.env.TRANSCRIPT = transcript;
    return capReached();
  };
  assert.match(run('error_max_budget_usd'), /бюджет/);
  assert.match(run('error_max_turns'), /стъпки/);
  assert.strictEqual(run('success'), '');
  delete process.env.TRANSCRIPT;
});
