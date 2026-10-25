const test = require('node:test');
const assert = require('node:assert');
const { parseIssueForm, extractImageUrls, photosToDownload, download, MAX_BYTES } = require('./from-issue');

const FRONT = 'https://github.com/user-attachments/assets/c1a354a5-8893-4571-9a3e-0123456789ab';
const BACK = 'https://github.com/user-attachments/assets/0b1c2d3e-aaaa-4bbb-8ccc-123456789abc';

test('the form is read field by field', () => {
  const fields = parseIssueForm(`### Име на продукта\n\nСтатуетка\n\n### Снимки\n\n<img src="${FRONT}" />\n\n### Основен продукт?\n\nДа`);
  assert.strictEqual(fields['име на продукта'], 'Статуетка');
  assert.strictEqual(fields['основен продукт?'], 'Да');
  assert.deepStrictEqual(extractImageUrls(fields['снимки']), [FRONT]);
});

test('every shape GitHub uses for an uploaded photo is found, in order', () => {
  const value = `![front](${FRONT})\n<img width="1080" alt="Image" src='${BACK}' />`;
  assert.deepStrictEqual(extractImageUrls(value), [FRONT, BACK]);
  assert.deepStrictEqual(extractImageUrls(`${FRONT}\n${BACK}.`), [FRONT, BACK]);
});

test('only photos dropped into the issue are downloaded; pasted links are left out', () => {
  const value = [
    '<img src="https://makerworld.com/models/123/photo.jpg" />',
    `<img src="${FRONT}" />`,
    '![x](https://i.imgur.com/abc.jpg)',
    `<img src="${BACK}" />`,
    '<img src="http://169.254.169.254/latest/meta-data/" />',
  ].join('\n');
  const { photos, ignored } = photosToDownload(value);
  assert.deepStrictEqual(photos, [FRONT, BACK], 'first stays front, second back');
  assert.strictEqual(ignored.length, 3);
});

test('links only: nothing to download', () => {
  assert.deepStrictEqual(photosToDownload('https://photos.google.com/share/abc').photos, []);
});

/** Swaps global fetch for one test; records each call. */
function withFetch(respond, fn) {
  const calls = [];
  const real = global.fetch;
  global.fetch = async (url, opts) => {
    calls.push({ url, opts });
    return respond(url, opts);
  };
  return fn(calls).finally(() => { global.fetch = real; });
}

test('a download never carries a token, even when one is in the environment', () => withFetch(
  () => new Response(Buffer.from('jpeg'), { status: 200 }),
  async (calls) => {
    const saved = process.env.GITHUB_TOKEN;
    process.env.GITHUB_TOKEN = 'ghs_should_never_be_sent';
    try {
      const buf = await download(FRONT);
      assert.strictEqual(buf.toString(), 'jpeg');
    } finally {
      if (saved === undefined) delete process.env.GITHUB_TOKEN; else process.env.GITHUB_TOKEN = saved;
    }
    assert.strictEqual(calls.length, 1);
    const headers = new Headers(calls[0].opts && calls[0].opts.headers);
    assert.strictEqual(headers.get('authorization'), null);
  },
));

test('a URL outside GitHub attachments is refused before any request', () => withFetch(
  () => { throw new Error('fetch must not be called'); },
  async (calls) => {
    for (const url of ['https://example.com/a.jpg', 'http://github.com/user-attachments/assets/abc', 'file:///etc/passwd']) {
      await assert.rejects(download(url), /Not a GitHub attachment URL/);
    }
    assert.strictEqual(calls.length, 0);
  },
));

test('an oversized file is refused', () => withFetch(
  () => new Response('x', { status: 200, headers: { 'content-length': String(MAX_BYTES + 1) } }),
  async () => { await assert.rejects(download(FRONT), /larger than 50 MB/); },
));
