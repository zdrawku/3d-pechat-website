const test = require('node:test');
const assert = require('node:assert');
const { overLimit, RUN_MARKER } = require('./limits');

const now = Date.parse('2026-10-24T12:00:00Z');
const bot = (hoursAgo, body = `Готово ${RUN_MARKER}`) => ({
  user: { login: 'github-actions[bot]' }, body, created_at: new Date(now - hoursAgo * 3600 * 1000).toISOString(),
});
const person = { user: { login: 'zdrawku' }, body: RUN_MARKER, created_at: new Date(now).toISOString() };

test('within limits: counts only the bot’s run comments', () => {
  const r = overLimit({ issueComments: [bot(1), bot(2), person, bot(1, 'reject notice')], recentComments: [bot(1), bot(2)], now, maxVersions: 5, maxPerDay: 8 });
  assert.deepStrictEqual(r, { over: false, versions: 2, today: 2 });
});

test('too many versions on one issue', () => {
  const runs = [bot(1), bot(2), bot(3), bot(4), bot(5)];
  const r = overLimit({ issueComments: runs, recentComments: runs, now, maxVersions: 5, maxPerDay: 8 });
  assert.ok(r.over);
  assert.match(r.reason, /5 версии/);
});

test('too many runs in 24 hours; older runs don’t count', () => {
  const recent = Array.from({ length: 8 }, (_, i) => bot(i + 1));
  assert.match(overLimit({ issueComments: [], recentComments: recent, now, maxVersions: 5, maxPerDay: 8 }).reason, /24 часа/);
  const old = Array.from({ length: 8 }, (_, i) => bot(25 + i));
  assert.strictEqual(overLimit({ issueComments: [], recentComments: old, now, maxVersions: 5, maxPerDay: 8 }).over, false);
});
