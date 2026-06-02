// Scrapes Bulgarian 3D printing blogs for fresh article ideas.
// Falls back to a curated hardcoded list when scraping fails or every idea
// duplicates an already-published slug.

const fs = require('fs');
const path = require('path');
const fallbackTopics = require('./fallback-topics');

const SOURCES = [
  {
    url: 'https://3dlarge.com/blogs/3d-printirane-3d-printeri/',
    selector: 'article, .blog-article, .article-card, .post',
    titleSelector: 'h2, h3, .article-title, a.title'
  },
  {
    url: 'https://3dbgprint.com/blog/',
    selector: 'article, .post, .blog-post',
    titleSelector: 'h2, h3, .entry-title'
  },
  {
    url: 'https://all3dp.com/topics/3d-printing/',
    selector: 'article, .article-card',
    titleSelector: 'h2, h3, .article-card__title'
  },
  {
    url: 'https://edufacturing.com/tendencii-v-3d-pechata/',
    selector: 'article, .post, .entry',
    titleSelector: 'h1, h2, h3, .entry-title'
  },
  {
    url: 'https://3izmerno.com/blog',
    selector: 'article, .post, .blog-item',
    titleSelector: 'h2, h3, .post-title, a.title'
  },
  {
    url: 'https://3dprintx.bg/',
    selector: 'article, .post, .product, .blog-post',
    titleSelector: 'h2, h3, .entry-title, .product-title'
  },
  {
    url: 'https://print24.com/bg/journal/printing-basics/3d-printing',
    selector: 'article, .article, .post, .journal-item',
    titleSelector: 'h2, h3, .article-title, .entry-title'
  },
  {
    url: 'https://www.3dopendesign.com/blog',
    selector: 'article, .post, .blog-post',
    titleSelector: 'h2, h3, .entry-title, .post-title'
  },
  {
    url: 'https://3dpro.bg/kak-da-spechelim-pari-ot-3d-pechat/',
    selector: 'article, .post, .entry, .content',
    titleSelector: 'h1, h2, h3, .entry-title'
  }
];

const FETCH_TIMEOUT_MS = 15_000;

function slugify(text) {
  // Transliteration of Bulgarian Cyrillic to Latin so slugs stay URL-friendly.
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i',
    й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's',
    т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht',
    ъ: 'a', ь: 'y', ю: 'yu', я: 'ya'
  };
  return text
    .toLowerCase()
    .split('')
    .map(ch => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function readExistingSlugs() {
  const servicePath = path.resolve(__dirname, '../../src/app/services/blog.service.ts');
  const content = fs.readFileSync(servicePath, 'utf8');
  const slugs = new Set();
  const re = /slug:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(content)) !== null) slugs.add(m[1]);
  return slugs;
}

async function fetchWithTimeout(url, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; 3DPechatBot/1.0; +https://3dpechat.bg)'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function scrapeSource(source) {
  let cheerio;
  try {
    cheerio = require('cheerio');
  } catch {
    console.warn('[scrape-ideas] cheerio not available, skipping scraping');
    return [];
  }
  try {
    const html = await fetchWithTimeout(source.url);
    const $ = cheerio.load(html);
    const items = [];
    $(source.selector).each((_, el) => {
      const titleEl = $(el).find(source.titleSelector).first();
      const title = titleEl.text().trim();
      if (!title || title.length < 10) return;
      const summary = $(el).find('p').first().text().trim().slice(0, 280);
      items.push({ topic: title, sourceUrl: source.url, summary });
    });
    return items;
  } catch (err) {
    console.warn(`[scrape-ideas] failed to scrape ${source.url}: ${err.message}`);
    return [];
  }
}

function pickFresh(candidates, existingSlugs) {
  for (const c of candidates) {
    const slug = slugify(c.topic);
    if (!slug || existingSlugs.has(slug)) continue;
    return { ...c, suggestedSlug: slug };
  }
  return null;
}

async function getTopicIdea() {
  const manual = process.env.MANUAL_TOPIC && process.env.MANUAL_TOPIC.trim();
  if (manual) {
    return {
      topic: manual,
      sourceUrl: 'manual-input',
      summary: 'Топик, зададен ръчно през workflow_dispatch.',
      suggestedSlug: slugify(manual)
    };
  }

  const existingSlugs = readExistingSlugs();
  const scraped = [];
  for (const src of SOURCES) {
    const items = await scrapeSource(src);
    scraped.push(...items);
  }
  // Shuffle scraped results to vary output across runs.
  scraped.sort(() => Math.random() - 0.5);
  const fresh = pickFresh(scraped, existingSlugs);
  if (fresh) {
    console.log(`[scrape-ideas] using scraped topic: ${fresh.topic}`);
    return fresh;
  }

  console.warn('[scrape-ideas] falling back to hardcoded topics');
  const shuffled = [...fallbackTopics].sort(() => Math.random() - 0.5);
  const fb = pickFresh(
    shuffled.map(t => ({ ...t, sourceUrl: 'fallback-list' })),
    existingSlugs
  );
  if (!fb) {
    throw new Error('No fresh topic ideas available (all duplicates)');
  }
  console.log(`[scrape-ideas] using fallback topic: ${fb.topic}`);
  return fb;
}

module.exports = { getTopicIdea, slugify, readExistingSlugs };

if (require.main === module) {
  getTopicIdea()
    .then(t => console.log(JSON.stringify(t, null, 2)))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
