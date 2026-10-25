const test = require('node:test');
const assert = require('node:assert');
const { linkIdOf, issueOf, toAnnounce, liveComment, productUrl, MARKER } = require('./live');

const now = Date.parse('2026-10-25T12:00:00Z');
const pr = (over) => ({
  number: 62,
  title: '📦 Нов продукт: Статуетка „Крал и кралица“',
  head: { ref: 'add-product/statuetka-kral-i-kralitsa' },
  body: '## Нов продукт от issue #61\n\n…\n\nCloses #61',
  merged_at: '2026-10-25T10:00:00Z',
  ...over,
});

test('a product PR gives its linkId and its issue', () => {
  assert.strictEqual(linkIdOf(pr()), 'statuetka-kral-i-kralitsa');
  assert.strictEqual(issueOf(pr()), 61);
  assert.strictEqual(linkIdOf(pr({ head: { ref: 'short-video-testing' } })), null);
  assert.strictEqual(linkIdOf(pr({ head: { ref: 'add-product/../../evil' } })), null);
  assert.strictEqual(issueOf(pr({ body: 'Fixes stuff' })), null);
});

test('only product PRs merged in the last day are linked', () => {
  const prs = [
    pr(),
    pr({ number: 53, merged_at: '2026-10-23T09:00:00Z' }), // too old
    pr({ number: 60, merged_at: null }), // closed without merging
    pr({ number: 59, head: { ref: 'short-video-testing' } }), // not a product
  ];
  assert.deepStrictEqual(toAnnounce(prs, now), [{ pr: 62, linkId: 'statuetka-kral-i-kralitsa', issue: 61, name: 'Статуетка „Крал и кралица“' }]);
});

test('the comment links the product on the site and carries the marker', () => {
  const text = liveComment({ name: 'Статуетка', linkId: 'statuetka-kral-i-kralitsa' });
  assert.match(text, /\[Статуетка\]\(https:\/\/3dpechat\.bg\/products\/#statuetka-kral-i-kralitsa\)/);
  assert.ok(text.includes(MARKER));
  assert.strictEqual(productUrl('x'), 'https://3dpechat.bg/products/#x');
});
