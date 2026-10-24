const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const lib = require('./lib');
const { render, FILE } = require('./generate-issue-form');

const products = lib.readProducts();

test('the committed issue form is up to date with products.json (run npm run build)', () => {
  assert.strictEqual(fs.readFileSync(FILE, 'utf8'), render(products));
});

test('every dropdown option resolves back to its product', () => {
  const yaml = render(products);
  for (const p of products) {
    assert.ok(yaml.includes(`- ${JSON.stringify(p.name)}`), p.name);
    assert.strictEqual(lib.findProduct(products, p.name).linkId, p.linkId);
  }
});

test('the form is labelled so parseShortIssue can read it back', () => {
  const yaml = render(products);
  for (const label of [lib.FORM.product, lib.FORM.media, lib.FORM.drive, lib.FORM.idea, lib.FORM.voice]) {
    assert.ok(yaml.includes(`label: ${JSON.stringify(label)}`), label);
  }
  assert.match(yaml, /labels: \['new-short'\]/);
});

test('the form is valid YAML with the five fields in order', (t) => {
  let yaml;
  try {
    yaml = require('js-yaml');
  } catch {
    return t.skip('js-yaml not installed');
  }
  const form = yaml.load(render(products));
  assert.deepStrictEqual(form.body.slice(1).map((b) => b.id), ['product', 'media', 'drive', 'idea', 'voice']);
  assert.strictEqual(form.body[1].attributes.options.length, products.length);
});

test('duplicate product names are refused', () => {
  assert.throws(() => render([...products, { ...products[0], linkId: 'copy' }]), /unique/);
});
