// Run with `npm run test:scripts` (node's built-in test runner).
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPrompt } = require('./generate-article');
const business = require('../../src/data/business.json');

const prompt = buildPrompt({ topic: 'Тестова тема', suggestedSlug: 'testova-tema' });

test('the article prompt carries every business fact verbatim', () => {
  assert.ok(business.facts.length > 0, 'business.json has facts');
  for (const fact of business.facts) {
    assert.ok(prompt.includes(fact), `missing fact: ${fact}`);
  }
});

test('the article prompt lists everything the article must never claim', () => {
  assert.ok(business.neverClaim.length > 0, 'business.json has neverClaim');
  for (const claim of business.neverClaim) {
    assert.ok(prompt.includes(claim), `missing never-claim: ${claim}`);
  }
});

test('business facts state FDM-only printing and the 3 € minimum order', () => {
  assert.deepEqual(business.technologies, ['FDM']);
  assert.ok(business.facts.some((f) => f.includes('само по FDM')));
  assert.ok(business.facts.some((f) => f.includes('3 €')));
});

test('the article prompt asks for euro only, never leva', () => {
  assert.match(prompt, /САМО в евро \(€\)/);
  assert.match(prompt, /никога в лева/);
});

test('the article prompt asks for the FAQ heading the page turns into FAQPage schema', () => {
  assert.ok(prompt.includes('„## Често задавани въпроси“'));
});
