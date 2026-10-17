// Run with `npm run test:scripts` (node's built-in test runner).
const test = require('node:test');
const assert = require('node:assert/strict');
const { slugify, truncateSlug } = require('./scrape-ideas');

test('slugify transliterates Bulgarian and kebab-cases', () => {
  assert.equal(slugify('Литофан с 3D принтиране'), 'litofan-s-3d-printirane');
});

test('slugify leaves slugs of 80 characters or fewer untouched', () => {
  const exactly80 = `${'a'.repeat(39)}-${'b'.repeat(40)}`;
  assert.equal(exactly80.length, 80);
  assert.equal(slugify(exactly80), exactly80);
});

test('slugify cuts at the last hyphen before 80 characters, not mid-word', () => {
  const title = 'Прозрачен и полупрозрачен PLA филамент: как да постигнете светлопропусклив 3D печат';
  const slug = slugify(title);
  assert.equal(slug, 'prozrachen-i-poluprozrachen-pla-filament-kak-da-postignete-svetlopropuskliv-3d');
  assert.ok(slug.length <= 80);
  assert.ok(!slug.endsWith('-'));
  // the pre-fix output ended in the half word "…-3d-p"
  assert.ok(!slug.endsWith('-3d-p'));
});

test('truncateSlug keeps a whole word when the cut lands exactly on a hyphen', () => {
  const slug = `${'a'.repeat(30)}-${'b'.repeat(49)}-ccc`; // hyphen at index 80
  assert.equal(slug[80], '-');
  assert.equal(truncateSlug(slug), `${'a'.repeat(30)}-${'b'.repeat(49)}`);
});

test('truncateSlug hard-cuts a single over-long word instead of returning ""', () => {
  assert.equal(truncateSlug('x'.repeat(120)), 'x'.repeat(80));
});

test('truncateSlug never leaves a trailing hyphen', () => {
  assert.ok(!truncateSlug(`${'a'.repeat(70)}-${'b'.repeat(40)}`).endsWith('-'));
});
