const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { run, findChunk, staticImports, addPreloads, spellings } = require('./preload-locale-chunks');

const locales = { defaultLocale: 'bg', locales: [{ code: 'bg' }, { code: 'en' }] };

test('finds the one chunk with the language marker, as is or \\u-escaped', () => {
  assert.equal(findChunk({ 'a.js': 'x', 'b.js': 'n("Open the menu")' }, 'Open the menu', 'en'), 'b.js');
  assert.deepEqual(spellings('Меню'), ['Меню', '\\u041c\\u0435\\u043d\\u044e']);
  assert.equal(findChunk({ 'c.js': 'n("\\u041c\\u0435\\u043d\\u044e")' }, 'Меню', 'de'), 'c.js');
  assert.throws(() => findChunk({ 'a.js': 'x' }, 'Open the menu', 'en'), /found 0/);
  assert.throws(() => findChunk({ 'a.js': 'Open the menu', 'b.js': 'Open the menu' }, 'Open the menu', 'en'), /found 2/);
});

test('reads a chunk’s static imports', () => {
  assert.deepEqual(staticImports('import{a as b}from"./chunk-AB.js";import"./x.css";export*from"./chunk-CD.js";from"./chunk-AB.js"'), ['chunk-AB.js', 'chunk-CD.js']);
});

test('adds missing preloads after the last one, once', () => {
  const html = '<head><link rel="modulepreload" href="chunk-1.js"><title>T</title></head>';
  const once = addPreloads(html, ['chunk-1.js', 'chunk-EN.js']);
  assert.equal(once, '<head><link rel="modulepreload" href="chunk-1.js"><link rel="modulepreload" href="chunk-EN.js"><title>T</title></head>');
  assert.equal(addPreloads(once, ['chunk-EN.js']), once);
  assert.equal(addPreloads('<head></head>', ['chunk-EN.js']), '<head><link rel="modulepreload" href="chunk-EN.js"></head>');
});

test('preloads the English strings on English pages and the article texts on post pages only', () => {
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'preload-'));
  fs.writeFileSync(path.join(dist, 'main.js'), 'import("./chunk-EN.js")');
  fs.writeFileSync(path.join(dist, 'chunk-EN.js'), 'import{x}from"./chunk-SHARED.js";const m={openMenu:"Open the menu"}');
  fs.writeFileSync(path.join(dist, 'chunk-SHARED.js'), '');
  fs.writeFileSync(path.join(dist, 'chunk-BG-TEXTS.js'), 'var CHUNK_MARKER="blog-content:bg";');
  fs.writeFileSync(path.join(dist, 'chunk-EN-TEXTS.js'), 'var CHUNK_MARKER="blog-content:translations";');
  for (const dir of ['', 'en', 'en/blog', 'en/blog/post-en', 'blog', 'blog/post', 'blog/old-url']) {
    fs.mkdirSync(path.join(dist, dir), { recursive: true });
    fs.writeFileSync(path.join(dist, dir, 'index.html'), '<head></head>');
  }
  const report = run(dist, { locales, marker: () => 'Open the menu', posts: { bulgarian: ['blog/post'], translated: ['en/blog/post-en'] } });
  assert.deepEqual(report, [
    { what: '/en/ strings', chunk: 'chunk-EN.js', files: 2, pages: 3 },
    { what: 'Bulgarian posts', chunk: 'chunk-BG-TEXTS.js', files: 1, pages: 1 },
    { what: 'translated posts', chunk: 'chunk-EN-TEXTS.js', files: 1, pages: 1 }
  ]);
  const read = (dir) => fs.readFileSync(path.join(dist, dir, 'index.html'), 'utf8');
  assert.match(read('en/blog/post-en'), /href="chunk-EN\.js".*href="chunk-SHARED\.js".*href="chunk-EN-TEXTS\.js"/);
  assert.equal(read('blog/post'), '<head><link rel="modulepreload" href="chunk-BG-TEXTS.js"></head>');
  for (const dir of ['', 'blog', 'blog/old-url']) assert.equal(read(dir), '<head></head>', dir || 'home');
  assert.doesNotMatch(read('en/blog'), /TEXTS/);
  fs.rmSync(dist, { recursive: true, force: true });
});
