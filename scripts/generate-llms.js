// Regenerates src/llms.txt from src/data/business.json (name, profiles, facts)
// and the blog post registry in blog-posts.registry.ts.
// Run manually: node scripts/generate-llms.js
// Also called automatically by the auto-blog pipeline and prebuild.

const fs = require('fs');
const path = require('path');
const { SITE, localizedPath, readLocales } = require('./locale-urls');

const ROOT = path.resolve(__dirname, '..');
const SERVICE_FILE = path.join(ROOT, 'src/app/services/blog-posts.registry.ts');
const BUSINESS_FILE = path.join(ROOT, 'src/data/business.json');
const FAQ_FILE = path.join(ROOT, 'src/data/faq.json');
const OUT_FILE = path.join(ROOT, 'src/llms.txt');

// Trailing slashes match the canonical URLs (GitHub Pages 301-redirects the
// non-slash directory routes to the slash form).
const MAIN_PAGES = [
  { url: 'https://3dpechat.bg/', label: 'Начало', desc: 'Услуги за 3D принтиране — прототипиране, малки серии, персонализирани изделия.' },
  { url: 'https://3dpechat.bg/portfolio/', label: 'Портфолио', desc: 'Реализирани проекти и примери от нашата работа.' },
  { url: 'https://3dpechat.bg/products/', label: 'Продукти', desc: 'Готови 3D принтирани продукти за директна покупка.' },
  { url: 'https://3dpechat.bg/products/bookmarks/', label: 'Разделители за книги', desc: 'Създайте свой разделител за книги от снимка, шарка или комплект и го поръчайте.' },
  { url: 'https://3dpechat.bg/prices/', label: 'Цени', desc: 'Цени за 3D печат по грамаж и онлайн калкулатор.' },
  { url: 'https://3dpechat.bg/contact/', label: 'Контакти', desc: 'Форма за запитване и контактна информация.' },
  { url: 'https://3dpechat.bg/blog/', label: 'Блог', desc: 'Статии за 3D принтиране на български език.' },
  { url: 'https://3dpechat.bg/privacy/', label: 'Политика за поверителност', desc: 'Кой обработва данните, какво получаваме, колко дълго го пазим и вашите права.' },
  { url: 'https://3dpechat.bg/terms/', label: 'Общи условия', desc: 'Поръчка, плащане, доставка, връщане, гаранция и права върху изпратените модели.' },
];

// The same pages in the site's other languages (src/i18n/locales.json), with
// labels and descriptions in that language. generate() fails if a localized
// page has no entry here, so a new page or language can't be left out.
const LANGUAGE_PAGES = {
  en: {
    intro: 'The main pages and a selection of blog articles are also available in English. Enquiries are answered in English and Bulgarian.',
    postsHeading: 'Blog articles in English',
    pages: {
      '/': { label: 'Home', desc: 'Custom FDM 3D printing in Sofia: prototypes, functional parts, small batches and personalised gifts.' },
      '/portfolio/': { label: 'Portfolio', desc: 'Projects we have printed to order.' },
      '/products/': { label: 'Products', desc: 'Ready 3D printed products to order.' },
      '/products/bookmarks/': { label: 'Bookmarks', desc: 'Design a bookmark from your picture, a pattern or a set, and order it.' },
      '/prices/': { label: 'Prices', desc: 'Prices by weight, a price calculator and the FAQ in English.' },
      '/contact/': { label: 'Contact', desc: 'Phone, Viber, email, address, opening hours and the enquiry form.' },
      '/blog/': { label: 'Blog', desc: 'The articles translated into English; the rest of the blog is in Bulgarian.' },
      '/privacy/': { label: 'Privacy Policy', desc: 'Who handles your data, what we receive, how long we keep it and your rights.' },
      '/terms/': { label: 'Terms of Use', desc: 'Ordering, payment, delivery, returns, the legal guarantee and rights to the models you send.' },
    },
  },
};

const translationsFile = (code) => path.join(ROOT, `src/i18n/${code}/content/blog.json`);

/**
 * "## English" sections for every non-default language in locales.json: its
 * main pages, then the posts translated into it (`translatedPosts`), with
 * their title and description from src/i18n/<code>/content/blog.json.
 */
function languageSections(locales, readCopy = (code) => JSON.parse(fs.readFileSync(translationsFile(code), 'utf8'))) {
  return locales.locales
    .filter((l) => l.code !== locales.defaultLocale)
    .flatMap((l) => {
      const copy = LANGUAGE_PAGES[l.code];
      if (!copy) throw new Error(`generate-llms.js: no LANGUAGE_PAGES entry for "${l.code}"`);
      const translated = Object.entries(locales.translatedPosts?.[l.code] ?? {});
      const postCopy = translated.length ? readCopy(l.code) : {};
      return [
        `## ${l.label}`,
        '',
        copy.intro,
        '',
        ...locales.localizedPages.map((page) => {
          const entry = copy.pages[page];
          if (!entry) throw new Error(`generate-llms.js: no ${l.code} label/description for ${page}`);
          return `- [${entry.label}](${SITE}${localizedPath(page, l.code, locales)}): ${entry.desc}`;
        }),
        '',
        ...(translated.length
          ? [
              `### ${copy.postsHeading}`,
              '',
              ...translated.map(([source, slug]) => {
                const post = postCopy[source];
                if (!post) throw new Error(`generate-llms.js: src/i18n/${l.code}/content/blog.json has no copy for "${source}"`);
                return `- [${post.title}](${SITE}/${l.code}/blog/${slug}/): ${post.description}`;
              }),
              '',
            ]
          : []),
      ];
    });
}

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
  const faq = JSON.parse(fs.readFileSync(FAQ_FILE, 'utf8'));
  const locales = readLocales();
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
    ...languageSections(locales),
    '## Факти',
    '',
    ...business.facts.map(f => `- ${f}`),
    `- Контакти: телефон и Viber ${phone}, имейл ${business.email}.`,
    '',
    '## Често задавани въпроси',
    '',
    'Същите отговори са видими на https://3dpechat.bg/prices/#faq.',
    '',
    ...faq.map(f => `- **${f.question}** ${f.answer}`),
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

if (require.main === module) {
  generate();
}

module.exports = { languageSections };
