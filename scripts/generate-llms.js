// Regenerates src/llms.txt from the blog post registry in blog.service.ts.
// Run manually: node scripts/generate-llms.js
// Also called automatically by the auto-blog pipeline and prebuild.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SERVICE_FILE = path.join(ROOT, 'src/app/services/blog.service.ts');
const OUT_FILE = path.join(ROOT, 'src/llms.txt');

// Trailing slashes match the canonical URLs (GitHub Pages 301-redirects the
// non-slash directory routes to the slash form).
const MAIN_PAGES = [
  { url: 'https://3dpechat.bg/', label: 'Начало', desc: 'Услуги за 3D принтиране — прототипиране, малки серии, персонализирани изделия.' },
  { url: 'https://3dpechat.bg/portfolio/', label: 'Портфолио', desc: 'Реализирани проекти и примери от нашата работа.' },
  { url: 'https://3dpechat.bg/products/', label: 'Продукти', desc: 'Готови 3D принтирани продукти за директна покупка.' },
  { url: 'https://3dpechat.bg/prices/', label: 'Цени', desc: 'Ценоразпис за 3D принтиране по материал и технология.' },
  { url: 'https://3dpechat.bg/contact/', label: 'Контакти', desc: 'Форма за запитване и контактна информация.' },
  { url: 'https://3dpechat.bg/blog/', label: 'Блог', desc: 'Статии за 3D принтиране на български език.' },
];

function parseBlogPosts(src) {
  // Extract each { id: '...', title: '...', description: '...', route: '...' } block
  const posts = [];
  const blockRe = /\{\s*id:\s*'[^']*'[\s\S]*?\}/g;
  let block;
  while ((block = blockRe.exec(src)) !== null) {
    const title = (block[0].match(/title:\s*'((?:[^'\\]|\\.)*)'/) || [])[1];
    const description = (block[0].match(/description:\s*'((?:[^'\\]|\\.)*)'/) || [])[1];
    const route = (block[0].match(/route:\s*'([^']*)'/) || [])[1];
    if (title && route) {
      posts.push({
        url: `https://3dpechat.bg${route.replace(/\/+$/, '')}/`,
        title: title.replace(/\\'/g, "'"),
        desc: description ? description.replace(/\\'/g, "'") : '',
      });
    }
  }
  return posts;
}

function generate() {
  const src = fs.readFileSync(SERVICE_FILE, 'utf8');
  const posts = parseBlogPosts(src);

  const lines = [
    '# 3D Печат България',
    '',
    '> Професионални услуги за 3D принтиране в България. Предлагаме FDM, SLA и SLS печат с бърза доставка в София и цялата страна.',
    '',
    '## Основни страници',
    '',
    ...MAIN_PAGES.map(p => `- [${p.label}](${p.url}): ${p.desc}`),
    '',
    '## Блог статии',
    '',
    ...posts.map(p => `- [${p.title}](${p.url})${p.desc ? ': ' + p.desc : ''}`),
    '',
  ];

  fs.writeFileSync(OUT_FILE, lines.join('\n'), 'utf8');
  console.log(`✅ llms.txt regenerated with ${posts.length} blog posts → src/llms.txt`);
}

generate();
