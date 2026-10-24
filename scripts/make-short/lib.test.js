const test = require('node:test');
const assert = require('node:assert');
const lib = require('./lib');

const products = lib.readProducts();
const business = lib.readBusiness();
const coin = products.find((p) => p.linkId === 'darzhach-za-evro-moneti-fidzhet-spinar');

// What GitHub puts in an issue created from .github/ISSUE_TEMPLATE/new-short.yml.
const ISSUE = `### Продукт

Държач за евро монети — фиджет спинър

### Снимки и клипове

<img width="1080" height="1440" alt="Image" src="https://github.com/user-attachments/assets/0b1c2d3e-aaaa-4bbb-8ccc-123456789abc" />

https://github.com/user-attachments/assets/9f8e7d6c-1111-4222-8333-abcdefabcdef

[not-ours](https://example.com/evil.mp4)

### Google Drive

- [X] Използвай и папката на продукта в Google Drive

### Идея (по избор)

Започни с въртенето

### Глас

Борислав (мъжки)`;

test('parses a short request: product, attachments, Drive, idea, voice', () => {
  const req = lib.parseShortIssue(ISSUE, products);
  assert.deepStrictEqual(req.errors, []);
  assert.strictEqual(req.product.linkId, 'darzhach-za-evro-moneti-fidzhet-spinar');
  assert.deepStrictEqual(req.attachmentUrls, [
    'https://github.com/user-attachments/assets/0b1c2d3e-aaaa-4bbb-8ccc-123456789abc',
    'https://github.com/user-attachments/assets/9f8e7d6c-1111-4222-8333-abcdefabcdef',
  ]);
  assert.strictEqual(req.useDrive, true);
  assert.strictEqual(req.idea, 'Започни с въртенето');
  assert.strictEqual(req.voice, 'bg-BG-BorislavNeural');
});

test('defaults: no attachments, Drive unticked, unknown voice → Калина', () => {
  const body = '### Продукт\n\nРазделители за книги\n\n### Снимки и клипове\n\n_No response_\n\n### Google Drive\n\n- [ ] Използвай и папката на продукта в Google Drive\n\n### Глас\n\n_No response_';
  const req = lib.parseShortIssue(body, products);
  assert.strictEqual(req.product.linkId, 'razdeliteli-za-knigi');
  assert.deepStrictEqual(req.attachmentUrls, []);
  assert.strictEqual(req.useDrive, false);
  assert.strictEqual(req.voice, 'bg-BG-KalinaNeural');
});

test('an unknown product is reported, not guessed', () => {
  const req = lib.parseShortIssue('### Продукт\n\nНещо несъществуващо', products);
  assert.strictEqual(req.product, null);
  assert.match(req.errors[0], /Нещо несъществуващо/);
});

test('only GitHub attachment hosts are downloadable', () => {
  for (const ok of [
    'https://github.com/user-attachments/assets/0b1c2d3e-aaaa-4bbb-8ccc-123456789abc',
    'https://github.com/user-attachments/files/123/clip.mp4',
    'https://github.com/zdrawku/3d-pechat-website/assets/11193764/0b1c2d3e-aaaa',
    'https://private-user-images.githubusercontent.com/1/2.jpg?jwt=x',
  ]) assert.ok(lib.isAttachmentUrl(ok), ok);
  for (const bad of [
    'http://github.com/user-attachments/assets/abc',
    'https://github.com/zdrawku/3d-pechat-website',
    'https://github.com.evil.com/user-attachments/assets/abc',
    'https://example.com/user-attachments/assets/abc',
    'file:///etc/passwd',
    'not a url',
  ]) assert.ok(!lib.isAttachmentUrl(bad), bad);
});

test('commands: /render and /redo with a note; everything else ignored', () => {
  assert.deepStrictEqual(lib.parseCommand('/render'), { cmd: 'render', note: '' });
  assert.deepStrictEqual(lib.parseCommand('  /redo по-кратко второто изречение\nи без глас'), { cmd: 'redo', note: 'по-кратко второто изречение\nи без глас' });
  assert.strictEqual(lib.parseCommand('Супер! /render'), null);
  assert.strictEqual(lib.parseCommand('/rendering'), null);
});

test('the spec survives a round trip through a comment, captions with --> included', () => {
  const spec = { product: 'x', beats: [{ caption: 'стрелка --> и `код`' }] };
  const body = `Чернова\n\n${lib.embedSpec(spec)}\n`;
  assert.deepStrictEqual(lib.extractSpec(body), spec);
  assert.strictEqual(lib.extractSpec('no spec here'), null);
});

test('facts check: product numbers pass, invented numbers and never-claims fail', () => {
  const sources = [coin.name, coin.description];
  assert.deepStrictEqual(lib.factsCheck(['Гнезда за 2 €, 1 € и 50 евроцента', 'Отпечатан на 3D принтер в София', 'От 0,80 € на 10 г'], { facts: business.facts, sources }), []);
  // A number the facts do contain ("2 часа" — 2 is in "2 евро") can't be
  // caught this way; that is what the human approval step is for.
  const problems = lib.factsCheck([
    'Готово за 48 часа',
    'Печатаме и със смола',
    'Само 5 лв!',
    'Издаваме фактури',
    'Готови в същия ден',
  ], { facts: business.facts, sources });
  assert.strictEqual(problems.length, 6, problems.join('\n')); // "5 лв" trips both the number and the currency
  assert.deepStrictEqual(lib.factsCheck(['Не издаваме фактури'], { facts: business.facts }), []);
});

const media = { m1: { kind: 'photo' }, m2: { kind: 'video', duration: 12 } };
const goodSpec = () => ({
  media,
  beats: [
    { source: 'm2', start: 4, caption: 'Къде държите евромонетите?', highlight: 'евромонетите?', voiceover: 'Къде държите евромонетите?' },
    { source: 'm1', start: 0, caption: 'Гнезда за 2 €, 1 € и 50 евроцента', highlight: '', voiceover: '' },
  ],
  endCard: { line: 'Отпечатан на 3D принтер в София', voiceover: '' },
  post: { title: 'Държач за евро монети', description: 'Описание', hashtags: ['#3dпечат', '#евро'] },
});

test('validateSpec accepts a good storyboard and names each problem in a bad one', () => {
  assert.deepStrictEqual(lib.validateSpec(goodSpec()), []);
  const bad = goodSpec();
  bad.beats[0].start = 11.8;
  bad.beats[1].source = 'm9';
  bad.beats[1].highlight = 'липсва';
  bad.post.hashtags = ['без решетка'];
  const problems = lib.validateSpec(bad);
  assert.strictEqual(problems.length, 4, problems.join('\n'));
  assert.deepStrictEqual(lib.validateSpec({ ...goodSpec(), beats: [goodSpec().beats[0]] }), ['Трябват между 2 и 5 кадъра.']);
});

test('beat timing follows the voice line within limits', () => {
  assert.strictEqual(lib.beatDuration(0), 3);
  assert.strictEqual(lib.beatDuration(1), 2.5);
  assert.strictEqual(lib.beatDuration(3), 3.45);
  assert.strictEqual(lib.beatDuration(9), 7);
  assert.strictEqual(lib.endCardDuration(4), 4.6);
});

test('clip filter: upright clips fill the frame, landscape ones get a blurred backdrop', () => {
  assert.doesNotMatch(lib.clipFilter({ width: 1080, height: 1920 }, 3), /boxblur/);
  assert.match(lib.clipFilter({ width: 1920, height: 1080 }, 3), /boxblur/);
  assert.match(lib.clipFilter({ width: 1440, height: 1080 }, 3), /trim=duration=3,/);
  assert.match(lib.photoFilter(3.5, false), /d=105:/);
});

test('Drive product folder by linkId or catalog name, never an underscore folder', () => {
  const folders = [{ id: 'a', name: '_music' }, { id: 'b', name: 'Държач за евро монети - фиджет спинър' }, { id: 'c', name: 'razdeliteli-za-knigi' }];
  assert.strictEqual(lib.pickProductFolder(folders, coin).id, 'b');
  assert.strictEqual(lib.pickProductFolder(folders, products.find((p) => p.linkId === 'razdeliteli-za-knigi')).id, 'c');
  assert.strictEqual(lib.pickProductFolder(folders, products.find((p) => p.linkId === 'headphone-stand')), null);
});

test('end-card handles come from business.json sameAs', () => {
  assert.strictEqual(lib.socialHandles(business), '@3dpechat.bg · YouTube @3dpechatbg');
});
