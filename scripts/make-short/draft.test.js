const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const lib = require('./lib');
const { buildContent, reviewDraft, SCHEMA } = require('./draft');

const product = lib.readProducts().find((p) => p.linkId === 'darzhach-za-evro-moneti-fidzhet-spinar');
const business = lib.readBusiness();

test('the request shows each media item with its id, and clip frames with their time', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'short-'));
  const jpg = path.join(dir, 'p.jpg');
  fs.writeFileSync(jpg, Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
  const manifest = {
    media: { m1: { kind: 'video', duration: 6.7, name: 'spin.mp4' }, m2: { kind: 'photo', name: 'снимка от каталога (лице)' } },
    previews: [{ id: 'm1', t: 0, file: jpg }, { id: 'm1', t: 1, file: jpg }, { id: 'm2', file: jpg }],
  };
  const content = buildContent({ product, business, manifest, idea: 'Започни с въртенето', voice: 'bg-BG-KalinaNeural' });
  const texts = content.filter((b) => b.type === 'text').map((b) => b.text);
  assert.match(texts[0], /Държач за евро монети/);
  assert.match(texts[0], /Започни с въртенето/);
  assert.ok(business.neverClaim.every((c) => texts[0].includes(c)), 'every never-claim is in the prompt');
  assert.deepStrictEqual(texts.slice(1), ['m1 — клип, 6.7 s (spin.mp4). Кадри:', 'm1 @ 0 s', 'm1 @ 1 s', 'm2 — снимка (снимка от каталога (лице)):']);
  assert.strictEqual(content.filter((b) => b.type === 'image').length, 3);
  assert.strictEqual(content.find((b) => b.type === 'image').source.media_type, 'image/jpeg');
});

test('with the voice off the prompt asks for empty voice lines', () => {
  const content = buildContent({ product, business, manifest: { media: {}, previews: [] }, voice: null });
  assert.match(content[0].text, /always "" \(this short has music only\)/);
});

test('the output schema is strict at every level (structured outputs)', () => {
  const objects = [SCHEMA, SCHEMA.properties.beats.items, SCHEMA.properties.endCard, SCHEMA.properties.post];
  for (const o of objects) {
    assert.strictEqual(o.additionalProperties, false);
    assert.deepStrictEqual([...o.required].sort(), Object.keys(o.properties).sort());
  }
});

test('reviewDraft combines structure and facts problems', () => {
  const spec = {
    media: { m1: { kind: 'photo' } },
    beats: [
      { source: 'm1', start: 0, caption: 'Готово в същия ден', highlight: '', voiceover: '' },
      { source: 'm1', start: 0, caption: 'Само за 99 €', highlight: '', voiceover: '' },
    ],
    endCard: { line: 'Отпечатан в София', voiceover: '' },
    post: { title: 'Т', description: 'О', hashtags: ['#3dпечат'] },
  };
  const problems = reviewDraft(spec, { product, business, idea: '' });
  assert.strictEqual(problems.length, 2, problems.join('\n'));
});
