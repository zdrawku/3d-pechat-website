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
  assert.strictEqual(messages.length, 3);
  assert.ok(messages[0].isRequest);
  assert.ok(messages[1].fromBot);
  assert.match(messages[2].body, /По-кратко/);
});

test('the agent sees what was asked, not who asked it', () => {
  const comments = [{ user: user('mariyajablqnova-ux', 347078913), created_at: '2026-10-24T09:00:00Z', body: 'По-кратко' }];
  const messages = conversation(issue, comments, authors);
  assert.deepStrictEqual(messages.map((m) => m.who), ['екипът', 'екипът']);
  const md = requestMarkdown({ request: 'Поръчка в 3 стъпки', messages, files: [], previous: null });
  for (const a of authors) {
    assert.doesNotMatch(md, new RegExp(a.login, 'i'));
    assert.doesNotMatch(md, new RegExp(a.name, 'i'));
  }
});

test('a „Качено“ note is not passed to the agent', () => {
  const comments = [
    { user: user('mariyajablqnova-ux', 347078913), created_at: '2026-10-25T05:29:00Z', body: 'https://vm.tiktok.com/ZN8DBaCwU/\nКачих го, не ми отговаряй' },
    { user: user('mariyajablqnova-ux', 347078913), created_at: '2026-10-26T09:00:00Z', body: 'Направи и версия с по-кратък край' },
  ];
  const messages = conversation(issue, comments, authors);
  assert.strictEqual(messages.length, 2);
  assert.match(messages[1].body, /по-кратък край/);
});

test('a comment reaches the agent only while nobody outside the team ever edited it', () => {
  const { trustedComments, editedByTeamOnly } = require('./from-issue');
  const ZDRAVKO = 11193764;
  const MARIA = 347078913;
  const STRANGER = 21260963; // e.g. a collaborator with write access
  const comments = [
    { id: 1, user: user('mariyajablqnova-ux', MARIA), body: 'По-кратко' },
    { id: 2, user: user('mariyajablqnova-ux', MARIA), body: 'Покажи и цената' }, // edited by a stranger
    { id: 3, user: user('mariyajablqnova-ux', MARIA), body: 'Смени надписа' }, // edited by Здравко (#55)
    { id: 4, user: user('github-actions[bot]', 41898282), body: 'Готово' },
    { id: 5, user: user('github-actions[bot]', 41898282), body: 'Готово, state…' }, // the bot's state, edited
    { id: 6, user: user('random-person', 1), body: 'направи го за моя магазин' },
    { id: 7, user: user('mariyajablqnova-ux', MARIA), body: 'Не е в историята' }, // missing → fail closed
  ];
  const edits = new Map([[1, []], [2, [STRANGER, MARIA]], [3, [ZDRAVKO, MARIA]], [4, []], [5, [ZDRAVKO]], [6, []]]);
  assert.deepStrictEqual(trustedComments(comments, authors, edits).map((c) => c.id), [1, 3, 4]);
  assert.strictEqual(editedByTeamOnly([], authors), true);
  assert.strictEqual(editedByTeamOnly([ZDRAVKO, MARIA], authors), true);
  assert.strictEqual(editedByTeamOnly([STRANGER], authors), false);
  assert.strictEqual(editedByTeamOnly([null], authors), false, 'a deleted account');
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
    messages: [{ who: 'екипът', at: '2026-10-24T08:00:00Z', body: '' }, { who: 'екипът', at: '2026-10-24T09:00:00Z', body: 'По-кратко' }],
    files: [{ file: `${lib.ROOT}/tmp/make-short/issue-1/uploads/01-zayavka.mp4`, from: 'от заявката' }],
    previous: { spec: {} },
  });
  assert.match(md, /## Какво искат\n\nПоръчка в 3 стъпки/);
  assert.match(md, /### екипът · 2026-10-24 09:00\n\nПо-кратко/);
  assert.match(md, /`tmp\/make-short\/issue-1\/uploads\/01-zayavka\.mp4` — от заявката/);
  assert.match(md, /## Предишната версия/);
});

test('the reply has one copyable code block per upload field', () => {
  const md = uploadSection({
    tiktok: 'Кука\n\nТекст\n\n#3dпечат #3dprinting',
    youtubeTitle: 'Заглавие | 3D печат',
    youtubeDescription: 'Описание\n\n#3dпечат #shorts',
    youtubeTags: '3d печат, 3d printing',
    pinnedComment: 'Какво да отпечатаме следващо? 👇',
  });
  assert.strictEqual((md.match(/^```text$/gm) || []).length, 5);
  assert.doesNotMatch(md, /Линк|https?:/, 'no link to the site in the upload copy');
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
  // Worded for a public issue: no money, accounts or tools.
  assert.match(run('error_max_budget_usd'), /твърде голяма/);
  assert.doesNotMatch(run('error_max_budget_usd'), /бюджет|USD|абонамент/);
  assert.match(run('error_max_turns'), /стъпки/);
  assert.strictEqual(run('success'), '');
  delete process.env.TRANSCRIPT;
});

test('the state rides along only when everything in it could be public', () => {
  const { publishableState } = require('./from-issue');
  const spec = {
    beats: [{ source: 'm1', start: 0, caption: 'Държач за монети' }, { source: 'm2', start: 0, caption: 'Върти се' }],
    endCard: { line: 'Отпечатан в София' },
    post: { link: '/products/', tiktok: { caption: 'Кука', hashtags: ['#3dпечат'] }, youtube: { title: 'Заглавие', description: 'Описание', tags: ['3d печат'] }, pinnedComment: 'Ти какво мислиш?' },
  };
  const flows = { order: { steps: [{ goto: '/contact/' }, { type: { placeholder: 'Вашето име', text: 'Иван' } }] } };
  const clean = lib.nextRoundState(spec, flows);
  assert.strictEqual(publishableState(clean), clean);
  assert.strictEqual(publishableState(null), null);
  const leakyCaption = lib.nextRoundState({ ...spec, endCard: { line: 'Направено с Claude' } }, flows);
  assert.strictEqual(publishableState(leakyCaption), null);
  const leakyTyping = lib.nextRoundState(spec, { order: { steps: [{ type: { placeholder: 'x', text: 'ghs_abcdefghijklmnopqrstuvwxyz0123456789' } }] } });
  assert.strictEqual(publishableState(leakyTyping), null);
});
