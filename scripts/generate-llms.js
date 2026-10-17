// Regenerates src/llms.txt from src/data/business.json (name, profiles, facts)
// and the blog post registry in blog-posts.registry.ts.
// Run manually: node scripts/generate-llms.js
// Also called automatically by the auto-blog pipeline and prebuild.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SERVICE_FILE = path.join(ROOT, 'src/app/services/blog-posts.registry.ts');
const BUSINESS_FILE = path.join(ROOT, 'src/data/business.json');
const OUT_FILE = path.join(ROOT, 'src/llms.txt');

// Trailing slashes match the canonical URLs (GitHub Pages 301-redirects the
// non-slash directory routes to the slash form).
const MAIN_PAGES = [
  { url: 'https://3dpechat.bg/', label: 'Начало', desc: 'Услуги за 3D принтиране — прототипиране, малки серии, персонализирани изделия.' },
  { url: 'https://3dpechat.bg/portfolio/', label: 'Портфолио', desc: 'Реализирани проекти и примери от нашата работа.' },
  { url: 'https://3dpechat.bg/products/', label: 'Продукти', desc: 'Готови 3D принтирани продукти за директна покупка.' },
  { url: 'https://3dpechat.bg/prices/', label: 'Цени', desc: 'Цени за 3D печат по грамаж и онлайн калкулатор.' },
  { url: 'https://3dpechat.bg/contact/', label: 'Контакти', desc: 'Форма за запитване и контактна информация.' },
  { url: 'https://3dpechat.bg/blog/', label: 'Блог', desc: 'Статии за 3D принтиране на български език.' },
];

// Labels for the official profiles. The URLs themselves come from `sameAs` in
// business.json (the same list the LocalBusiness schema uses), so the two can't
// drift; a profile added there shows up here with its host name as the label.
const PROFILE_LABELS = {
  'www.youtube.com': { label: 'YouTube', desc: 'Видеа от работилницата и проектите ни.' },
  'www.instagram.com': { label: 'Instagram', desc: 'Снимки на реализирани проекти.' },
  'www.tiktok.com': { label: 'TikTok', desc: 'Кратки видеа от процеса на 3D печат.' },
  'makerworld.com': { label: 'MakerWorld', desc: 'Наши 3D модели за изтегляне и принтиране.' },
};

function profiles(sameAs) {
  return sameAs.map((url) => {
    const host = new URL(url).host;
    return { url, ...(PROFILE_LABELS[host] || { label: host, desc: '' }) };
  });
}

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
  const business = JSON.parse(fs.readFileSync(BUSINESS_FILE, 'utf8'));
  const phone = business.telephone.replace(/^\+359(\d{3})(\d{3})(\d{3})$/, '+359 $1 $2 $3');

  const lines = [
    `# ${business.name}`,
    '',
    `> ${business.name} (${business.alternateName.join(', ')}) – 3D печат по поръчка в София: прототипи, функционални детайли, малки серии и персонализирани подаръци. Печатаме само по FDM технология, основно с PLA, с доставка в София и в цялата страна.`,
    '',
    '## Основни страници',
    '',
    ...MAIN_PAGES.map(p => `- [${p.label}](${p.url}): ${p.desc}`),
    '',
    '## Факти',
    '',
    ...business.facts.map(f => `- ${f}`),
    `- Контакти: телефон и Viber ${phone}, имейл ${business.email}.`,
    '',
    '## Профили',
    '',
    ...profiles(business.sameAs).map(p => `- [${p.label}](${p.url})${p.desc ? ': ' + p.desc : ''}`),
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
