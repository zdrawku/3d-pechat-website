// Drafts the English version of a Bulgarian blog post via the Anthropic Claude
// API: the text, its copy (title, description, tags, keywords) and its slug.
// The pipeline (index.js) runs it right after the Bulgarian post, so both land
// in the same PR and are reviewed together — nothing is published unreviewed.
// `npm run translate-post -- <slug>` runs it for an existing post.
//
// What the model returns is normalised here, so a slip can't ship: internal
// links are mapped to the English pages (a link to a Bulgarian-only post is
// unwrapped), the H1 is the title, the slug is kebab-case and the description
// fits a search snippet.

const fs = require('fs');
const path = require('path');
const { slugify } = require('./scrape-ideas');
const { readLocales, localizedPath } = require('../locale-urls');
const business = require('../../src/data/business.json');

const ROOT = path.resolve(__dirname, '../..');
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
const LOCALE = 'en';
const MAX_DESCRIPTION = 160;

const copyFile = (locale) => path.join(ROOT, `src/i18n/${locale}/content/blog.json`);
const readCopies = (locale) => (fs.existsSync(copyFile(locale)) ? JSON.parse(fs.readFileSync(copyFile(locale), 'utf8')) : {});

/**
 * Bulgarian path → its page in `locale` ('/prices/' → '/en/prices/',
 * '/blog/<bg>/' → '/en/blog/<en>/'), for every localized page and translated post.
 */
function linkMap(locales = readLocales(), locale = LOCALE) {
  const map = new Map();
  for (const page of locales.localizedPages) map.set(page, localizedPath(page, locale, locales));
  for (const [source, slug] of Object.entries(locales.translatedPosts?.[locale] ?? {})) {
    map.set(`/blog/${source}/`, `/${locale}/blog/${slug}/`);
  }
  return map;
}

/**
 * Markdown with every internal link pointing at the `locale` page: Bulgarian
 * paths are mapped (keeping a #fragment for pages, dropping it for posts — a
 * translation's headings differ), links already in `locale` are kept when the
 * page exists, and anything else — a Bulgarian-only post, an unknown page — is
 * unwrapped to its text. Images and external links are left alone.
 */
function toLocaleLinks(markdown, map = linkMap(), locale = LOCALE) {
  const targets = new Set(map.values());
  const dropped = [];
  const fixed = markdown.replace(
    /(!?)\[([^\]]+)\]\((?:https?:\/\/(?:www\.)?3dpechat\.bg)?(\/[^)\s#?]*)([#?][^)\s]*)?\)/g,
    (whole, bang, text, rawPath, suffix = '') => {
      if (bang || /\.[a-z0-9]+$/i.test(rawPath)) return whole;
      const page = `${rawPath.replace(/\/+$/, '')}/`.replace(/^\/\/$/, '/');
      const isPost = /^\/(?:[a-z]{2}\/)?blog\/[^/]+\/$/.test(page);
      if (targets.has(page)) return `[${text}](${page}${isPost ? '' : suffix})`;
      if (map.has(page)) return `[${text}](${map.get(page)}${isPost ? '' : suffix})`;
      dropped.push(rawPath);
      return text;
    }
  );
  return { markdown: fixed, dropped };
}

/** The English link targets, with titles, for the prompt. */
function linkTargets(locales = readLocales(), copies = readCopies(LOCALE)) {
  const pages = locales.localizedPages.map((page) => `   - ${localizedPath(page, LOCALE, locales)}`);
  const posts = Object.entries(locales.translatedPosts?.[LOCALE] ?? {})
    .map(([source, slug]) => `   - /${LOCALE}/blog/${slug}/ — ${copies[source]?.title ?? slug}`);
  return [...pages, ...posts].join('\n');
}

function buildTranslationPrompt({ markdown, seo }) {
  return `You are the English editor of 3dpechat.bg, a small custom FDM 3D printing service in Sofia, Bulgaria.
Write the English version of the Bulgarian blog post below for /en/blog/. Readers: English speakers in
Bulgaria (expats, international companies, students) and people anywhere searching the topic in English.
Write what a native English editor would publish: faithful to the content and structure, natural English,
not a word-for-word rendering.

FACTS ABOUT OUR SERVICE (business.json, in Bulgarian) — the only claims about our service you may make:
${business.facts.map((f) => `- ${f}`).join('\n')}
NEVER CLAIM (not even indirectly):
${business.neverClaim.map((c) => `- ${c}`).join('\n')}
If the Bulgarian text says something about our service that contradicts these facts, follow the facts.
Don't add facts, numbers, customers, quotes or experiences that aren't in the source. Prices only in euro (€).

STRUCTURE
1. Line 1: "# " + the English title. Then a blank line and "**Reading time: N min**".
2. Keep the sections, heading levels, lists, tables, images (paths exactly as they are; translate alt text) and their order.
3. Keep these markers exactly where they are: <!-- video -->, <!-- makerworld --> … <!-- /makerworld -->, {{MAKERWORLD_URL}}.
4. A "Често задавани въпроси" section becomes "## Frequently asked questions", with each question as a "### " heading
   and its answer as the paragraph(s) under it.

LINKS — internal links must end with "/" and point only at these English pages:
${linkTargets()}
A link to any other /blog/… page points at an article that exists only in Bulgarian: drop the link (keep the
sentence natural) or link a fitting page from the list. External links keep their URLs.

LANGUAGE
- British spelling (colour, favourite, metre, organise). Plain, friendly, expert; short sentences.
- No marketing filler ("in today's world", "unlock", "revolutionise"), no stacks of em-dashes.
- Use the words English-speaking makers search for (filament, infill, layer lines, slicer, supports,
  post-processing…); the title and headings should contain the phrases people type into Google in English.
- Bulgarian context: keep it where it's real (we're in Sofia; couriers Econt and Speedy) and explain what only
  Bulgarians would know. Refer to the business as "we"; the brand is "3dpechat.bg".

METADATA
- title: 50–65 characters, the main English search phrase in it.
- seoTitle: only when "<title> | 3dpechat.bg" would run past ~60 characters: a shorter "<…> | 3dpechat.bg".
- description: 140–${MAX_DESCRIPTION} characters, no prices, no hours, nothing beyond the facts.
- tags: 4–8 short card labels in sentence case. keywords: 6–10 English search phrases.
- slug: kebab-case, the English search phrase, not a transliteration of the Bulgarian slug.

The Bulgarian post's metadata: ${JSON.stringify({ title: seo.title, description: seo.description, tags: seo.tags })}

ANSWER in exactly this format — no other text:

===JSON===
{"slug":"...","title":"...","seoTitle":"...","description":"...","tags":["..."],"keywords":["..."]}
===MARKDOWN===
# Title
**Reading time: N min**

...

THE BULGARIAN POST:

${markdown}`;
}

/** { meta, markdown } from the model's delimited answer. */
function parseTranslation(text) {
  const jsonStart = text.indexOf('===JSON===');
  const mdStart = text.indexOf('===MARKDOWN===');
  if (jsonStart === -1 || mdStart === -1 || mdStart < jsonStart) {
    throw new Error('translation: the answer has no ===JSON=== / ===MARKDOWN=== sections');
  }
  const jsonRaw = text.slice(jsonStart + '===JSON==='.length, mdStart).trim()
    .replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  return { meta: JSON.parse(jsonRaw), markdown: text.slice(mdStart + '===MARKDOWN==='.length).trim() };
}

/** A description that fits a snippet: cut at the last word boundary under the limit. */
function fitDescription(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= MAX_DESCRIPTION) return clean;
  return clean.slice(0, MAX_DESCRIPTION + 1).replace(/\s+\S*$/, '').replace(/[,;:–-]\s*$/, '').trim();
}

/**
 * The translation, ready to file: { slug, markdown, copy }. `date` is the day
 * it is published (the pipeline's run, or today for an existing post).
 */
function normalizeTranslation({ meta, markdown }, { date, takenSlugs = [] }) {
  const title = String(meta.title || '').trim();
  if (!title) throw new Error('translation: no title');
  let slug = slugify(meta.slug || title).replace(/^(\d+-)+/, '');
  if (!slug) throw new Error('translation: no slug');
  for (let i = 2; takenSlugs.includes(slug); i++) slug = `${slugify(meta.slug || title)}-${i}`;

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  if (lines[0].startsWith('# ')) lines[0] = `# ${title}`;
  else lines.unshift(`# ${title}`, '');
  const { markdown: linked, dropped } = toLocaleLinks(lines.join('\n'));
  if (dropped.length) console.warn(`[translate] unwrapped ${dropped.length} link(s) with no English page: ${dropped.join(', ')}`);

  const list = (value) => (Array.isArray(value) ? value : String(value || '').split(',')).map((v) => String(v).trim()).filter(Boolean);
  const copy = {
    title,
    ...(meta.seoTitle && String(meta.seoTitle).trim() && String(meta.seoTitle).trim() !== title ? { seoTitle: String(meta.seoTitle).trim() } : {}),
    description: fitDescription(meta.description),
    tags: list(meta.tags),
    keywords: list(meta.keywords),
    date,
    dateModified: date
  };
  if (!copy.description) throw new Error('translation: no description');
  return { slug, markdown: `${linked.trim()}\n`, copy };
}

async function translateArticle({ markdown, seo }, { date = new Date().toISOString().slice(0, 10) } = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY env var is required');
  let Anthropic;
  try {
    Anthropic = require('@anthropic-ai/sdk');
  } catch {
    throw new Error('@anthropic-ai/sdk is not installed. Run: npm install --save-dev @anthropic-ai/sdk');
  }
  const client = Anthropic.default ? new Anthropic.default({ apiKey }) : new Anthropic({ apiKey });

  console.log(`[translate] requesting the English version from ${MODEL}…`);
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 12000,
    messages: [{ role: 'user', content: buildTranslationPrompt({ markdown, seo }) }]
  });
  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  const takenSlugs = Object.values(readLocales().translatedPosts?.[LOCALE] ?? {});
  return normalizeTranslation(parseTranslation(text), { date, takenSlugs });
}

module.exports = {
  LOCALE,
  buildTranslationPrompt,
  parseTranslation,
  normalizeTranslation,
  toLocaleLinks,
  linkMap,
  fitDescription,
  translateArticle
};
