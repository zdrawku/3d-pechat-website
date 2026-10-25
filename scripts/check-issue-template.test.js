const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { formLabels, fromTemplate } = require('./check-issue-template');

const form = (name) => formLabels(fs.readFileSync(path.join(__dirname, '..', '.github', 'ISSUE_TEMPLATE', name), 'utf8'));

test('reads the field labels of both forms, in order', () => {
  assert.deepStrictEqual(form('new-short.yml'), ['Какво видео искаш?', 'Снимки и клипове (по избор)']);
  const product = form('new-product.yml');
  assert.strictEqual(product[0], 'Име на продукта');
  assert.ok(product.includes('Описание') && product.includes('Снимки'), product.join(' | '));
});

test('an issue from the form passes; a hand-written one, or one with fields missing or reordered, does not', () => {
  const labels = form('new-short.yml');
  // What GitHub puts in an issue created from new-short.yml (issue #56).
  const fromForm = '### Какво видео искаш?\n\nОтиди в сайта и виж последния блог пост.\n\n### Снимки и клипове (по избор)\n\n_No response_';
  assert.strictEqual(fromTemplate(fromForm, labels), true);
  assert.strictEqual(fromTemplate('Направи ми видео за държача за монети', labels), false);
  assert.strictEqual(fromTemplate('### Какво видео искаш?\n\nВидео', labels), false);
  assert.strictEqual(fromTemplate('### Снимки и клипове (по избор)\n\nx\n\n### Какво видео искаш?\n\ny', labels), false);
  assert.strictEqual(fromTemplate('', labels), false);
  assert.strictEqual(fromTemplate(fromForm, []), false);
});
