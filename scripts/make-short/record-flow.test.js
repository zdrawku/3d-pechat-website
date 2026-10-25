const test = require('node:test');
const assert = require('node:assert');
const { validateFlow, VIEWPORT, SCALE } = require('./record-flow');

test('the recording is exactly 1080 × 1920', () => {
  assert.deepStrictEqual([VIEWPORT.width * SCALE, VIEWPORT.height * SCALE], [1080, 1920]);
});

test('a normal order flow is accepted', () => {
  assert.deepStrictEqual(validateFlow({
    steps: [
      { goto: '/products/' }, { mark: 'step1' }, { scrollTo: { text: 'Държач' } },
      { tap: { selector: '[data-testid=product-order-btn]' } }, { type: { placeholder: 'Вашето име', text: 'Мария' } }, { wait: 1500 },
    ],
  }), []);
  assert.deepStrictEqual(validateFlow({ baseUrl: 'http://localhost:4200', steps: [{ goto: '/' }] }), []);
});

test('only 3dpechat.bg or localhost can be recorded', () => {
  for (const baseUrl of ['https://example.com', 'https://3dpechat.bg.evil.com', 'https://evil.com/3dpechat.bg']) {
    assert.match(validateFlow({ baseUrl, steps: [{ goto: '/' }] })[0], /Only 3dpechat\.bg/, baseUrl);
  }
});

test('typed text is on screen: example data only, nothing off limits', () => {
  const typing = (text) => validateFlow({ steps: [{ goto: '/contact/' }, { type: { placeholder: 'Вашият имейл', text } }] });
  assert.deepStrictEqual(typing('ivan@example.com'), []);
  assert.match(typing('someone@company.com')[0], /имейл/);
  assert.match(typing('Работя с Claude')[0], /typed text/);
  assert.match(typing('x'.repeat(61))[0], /60 characters/);
});

test('malformed steps are named', () => {
  const problems = validateFlow({ steps: [{ goto: 'https://example.com' }, { eval: 'x' }, { tap: {}, wait: 1 }, { type: { placeholder: 'x' } }] });
  assert.strictEqual(problems.length, 4, problems.join('\n'));
  assert.ok(validateFlow({ steps: [{ wait: 100 }] }).some((p) => /goto/.test(p)));
});
