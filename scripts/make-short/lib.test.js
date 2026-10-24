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
  beats: [
    { source: 'm2', start: 4, caption: 'Къде държите евромонетите?', highlight: 'евромонетите?' },
    { source: 'm1', start: 0, seconds: 4, position: 'top', caption: '1. Избери продукт', highlight: 'продукт' },
  ],
  endCard: { line: 'Отпечатан на 3D принтер в София' },
  post: {
    link: '/products/',
    tiktok: {
      caption: 'Държиш ли още евромонетите в джоба? 👀\n\nТози държач събира 2 €, 1 € и 50 евроцента.\n\nКакво да отпечатаме следващо? Пиши ни на 3dpechat.bg 👇',
      hashtags: ['#3dпечат', '#3dprinting', '#софия', '#подарък'],
    },
    youtube: {
      title: 'Държач за евро монети, който се върти | 3D печат',
      description: 'Отпечатан на 3D принтер в София.\nАбонирай се за още отпечатани идеи.',
      tags: ['3d печат', '3d printing', '3д печат', '3d pechat', 'подарък', 'софия'],
    },
    pinnedComment: 'За бюрото или за подарък? 👇',
  },
});

test('validateSpec accepts a good storyboard and names each problem in a bad one', () => {
  assert.deepStrictEqual(lib.validateSpec(goodSpec()), []);
  const bad = goodSpec();
  bad.beats[0].start = 11.8;
  bad.beats[1].source = 'm9';
  bad.beats[1].highlight = 'липсва';
  bad.beats[1].seconds = 12;
  bad.beats[1].position = 'bottom';
  bad.post.tiktok.hashtags = ['без решетка', '#a', '#b'];
  const problems = lib.validateSpec(bad);
  assert.strictEqual(problems.length, 6, problems.join('\n'));
  assert.deepStrictEqual(lib.validateSpec({ ...goodSpec(), beats: [goodSpec().beats[0]] }), ['Трябват между 2 и 6 кадъра.']);
});

test('upload copy: each rule names its problem', () => {
  const cases = [
    [(p) => { p.link = '/products'; }, /post\.link/],
    [(p) => { p.tiktok.caption = `${'Много дълга кука '.repeat(8)}\n\nтекст`; }, /първият ред/],
    [(p) => { p.tiktok.caption += ' #3dпечат'; }, /не в текста/],
    [(p) => { p.tiktok.hashtags = ['#3dпечат', '#fyp', '#софия']; }, /fyp/],
    [(p) => { p.tiktok.hashtags = ['#3dпечат']; }, /3–8 хаштага/],
    [(p) => { p.youtube.title = 'Кратко'; }, /заглавието/],
    [(p) => { p.youtube.description += '\nhttps://3dpechat.bg'; }, /без линк/],
    [(p) => { p.youtube.tags = ['#3dпечат', 'a', 'b', 'c', 'd']; }, /без #/],
    [(p) => { p.youtube.tags = ['a', 'b']; }, /5–20 тага/],
    [(p) => { p.pinnedComment = ''; }, /Закаченият коментар/],
  ];
  for (const [mutate, expected] of cases) {
    const spec = goodSpec();
    mutate(spec.post);
    const problems = lib.validatePost(spec.post);
    assert.strictEqual(problems.length, 1, `${expected}: ${problems.join(' | ')}`);
    assert.match(problems[0], expected);
  }
  assert.match(lib.validatePost(undefined)[0], /post\.tiktok/);
});

test('upload copy is facts-checked like the video', () => {
  const spec = goodSpec();
  spec.post.youtube.description = 'Сега само за 99 € и с безплатна доставка в същия ден!';
  const problems = lib.factsCheck(lib.specTexts(spec), { facts: business.facts, sources: [coin.name, coin.description] });
  assert.ok(problems.some((p) => /99/.test(p)), problems.join('\n'));
  assert.ok(problems.some((p) => /същия ден/.test(p)), problems.join('\n'));
});

test('the finished copy: hashtags appended, tracked links, #shorts on YouTube', () => {
  const c = lib.uploadCopy(goodSpec(), 'short-issue-12');
  assert.match(c.tiktok, /Пиши ни на 3dpechat\.bg 👇\n\n#3dпечат #3dprinting #софия #подарък$/);
  assert.match(c.youtubeDescription, /👉 https:\/\/3dpechat\.bg\/products\/\?utm_source=youtube&utm_medium=shorts&utm_campaign=short-issue-12/);
  assert.match(c.youtubeDescription, /#3dпечат #3dprinting #софия #shorts$/);
  assert.strictEqual(c.youtubeTags, '3d печат, 3d printing, 3д печат, 3d pechat, подарък, софия');
  assert.match(c.siteLink, /utm_source=tiktok/);
  const text = lib.postText(goodSpec(), 'short-issue-12');
  for (const heading of ['TikTok', 'YouTube Shorts', 'Заглавие:', 'Тагове', 'Закачен коментар']) assert.ok(text.includes(heading), heading);
});

test('beat timing: long enough to read the caption, or the wanted length for a recorded step', () => {
  assert.strictEqual(lib.beatDuration('Кратко'), 2.5); // floor
  assert.strictEqual(lib.beatDuration('Къде държите евромонетите?'), 3.06); // 26 chars
  assert.strictEqual(lib.beatDuration('Гнезда за 2 €, 1 € и 50 евроцента дълго'), 3.84);
  assert.strictEqual(lib.beatDuration('Кратко', 5), 5);
  assert.strictEqual(lib.beatDuration('Кратко', 20), 8); // ceiling
  assert.strictEqual(lib.END_CARD_SECONDS, 3.5);
});

test('a spec carries no sound: no voice settings are needed or read', () => {
  const spec = goodSpec();
  assert.deepStrictEqual(lib.validateSpec(spec), []);
  assert.ok(!lib.specTexts(spec).some((t) => t === undefined), 'every text is a caption, end-card line or upload copy');
  assert.match(lib.postText(spec, 'short-x'), /без звук/);
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
