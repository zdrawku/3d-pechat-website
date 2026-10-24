const test = require('node:test');
const assert = require('node:assert');
const lib = require('./lib');

const products = lib.readProducts();
const business = lib.readBusiness();
const coin = products.find((p) => p.linkId === 'darzhach-za-evro-moneti-fidzhet-spinar');

// What GitHub puts in an issue created from .github/ISSUE_TEMPLATE/new-short.yml.
const ISSUE = `### Какво видео искаш?

Направи шорт видео което показва как да направиш поръчка през сайта в 3 лесни стъпки

### Снимки и клипове (по избор)

<img width="1080" height="1440" alt="Image" src="https://github.com/user-attachments/assets/0b1c2d3e-aaaa-4bbb-8ccc-123456789abc" />

https://github.com/user-attachments/assets/9f8e7d6c-1111-4222-8333-abcdefabcdef

[not-ours](https://example.com/evil.mp4)`;

test('parses a request: the words and the attachments', () => {
  const req = lib.parseShortIssue(ISSUE);
  assert.deepStrictEqual(req.errors, []);
  assert.match(req.request, /3 лесни стъпки/);
  assert.deepStrictEqual(req.attachmentUrls, [
    'https://github.com/user-attachments/assets/0b1c2d3e-aaaa-4bbb-8ccc-123456789abc',
    'https://github.com/user-attachments/assets/9f8e7d6c-1111-4222-8333-abcdefabcdef',
  ]);
});

test('an empty request is reported; no attachments is fine', () => {
  const req = lib.parseShortIssue('### Какво видео искаш?\n\n_No response_\n\n### Снимки и клипове (по избор)\n\n_No response_');
  assert.deepStrictEqual(req.attachmentUrls, []);
  assert.strictEqual(req.errors.length, 1);
});

test('products by linkId or name, punctuation ignored', () => {
  assert.strictEqual(lib.findProduct(products, 'darzhach-za-evro-moneti-fidzhet-spinar'), coin);
  assert.strictEqual(lib.findProduct(products, 'държач за евро монети - фиджет спинър'), coin);
  assert.strictEqual(lib.findProduct(products, 'няма такъв'), null);
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

test('the state survives a round trip through a comment, captions with --> included', () => {
  const state = { spec: { beats: [{ caption: 'стрелка --> и `код`' }] }, flows: { order: { steps: [] } } };
  const body = `Готово\n\n${lib.embedState(state)}\n`;
  assert.deepStrictEqual(lib.extractState(body), state);
  assert.strictEqual(lib.extractState('no state here'), null);
});

test('facts check: product and request numbers pass, invented numbers and never-claims fail', () => {
  const sources = [coin.name, coin.description, 'покажи поръчката в 3 лесни стъпки'];
  assert.deepStrictEqual(lib.factsCheck(['Гнезда за 2 €, 1 € и 50 евроцента', 'Отпечатан на 3D принтер в София', 'От 0,80 € на 10 г', '3 лесни стъпки'], { facts: business.facts, sources }), []);
  // A number the facts do contain ("2 часа" — 2 is in "2 евро") can't be
  // caught this way; that is why the agent rereads every line.
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
  voice: 'bg-BG-KalinaNeural',
  beats: [
    { source: 'm2', start: 4, caption: 'Къде държите евромонетите?', highlight: 'евромонетите?', voiceover: 'Къде държите евромонетите?' },
    { source: 'm1', start: 0, seconds: 4, position: 'top', caption: '1. Избери продукт', highlight: 'продукт', voiceover: '' },
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
  bad.beats[1].seconds = 12;
  bad.beats[1].position = 'bottom';
  bad.post.hashtags = ['без решетка'];
  const problems = lib.validateSpec(bad);
  assert.strictEqual(problems.length, 6, problems.join('\n'));
  assert.deepStrictEqual(lib.validateSpec({ ...goodSpec(), beats: [goodSpec().beats[0]] }), ['Трябват между 2 и 6 кадъра.']);
});

test('voice: only the two Bulgarian voices or null, and no voice lines without a voice', () => {
  assert.match(lib.validateSpec({ ...goodSpec(), voice: 'en-US-AriaNeural' })[0], /Непознат глас/);
  const silent = { ...goodSpec(), voice: null };
  assert.match(lib.validateSpec(silent)[0], /гласът е изключен/);
  silent.beats = silent.beats.map((b) => ({ ...b, voiceover: '' }));
  assert.deepStrictEqual(lib.validateSpec(silent), []);
});

test('beat timing follows the voice line, or the wanted length for a recorded step', () => {
  assert.strictEqual(lib.beatDuration(0), 3);
  assert.strictEqual(lib.beatDuration(1), 2.5);
  assert.strictEqual(lib.beatDuration(3), 3.45);
  assert.strictEqual(lib.beatDuration(9), 7);
  assert.strictEqual(lib.beatDuration(2, 5), 5);
  assert.strictEqual(lib.beatDuration(4, 2), 4.45);
  assert.strictEqual(lib.beatDuration(0, 20), 8);
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
