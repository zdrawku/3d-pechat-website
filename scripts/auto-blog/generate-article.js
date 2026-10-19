// Generates a Bulgarian-language blog article via the Anthropic Claude API.

const { slugify } = require('./scrape-ideas');
const { getBlogPosts, getStaticPages, fixInternalLinks } = require('./internal-links');
// The one source of truth for what the business offers. Every claim the article
// makes about our services must come from here (see CLAUDE.md, Rule 5).
const business = require('../../src/data/business.json');

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';

// Topic ideas are often numbered list items ("1. По-бързи машини"), which
// slugify turns into "1-po-barzi-…". Drop leading numeric segments; "3d-" has a
// letter in it and survives.
function cleanSlug(slug) {
  return slug.replace(/^(\d+-)+/, '');
}

function buildPrompt(topicObj) {
  const { topic, summary, sourceUrl, suggestedSlug, products } = topicObj;
  const year = new Date().getFullYear();
  const linkTargets = [...getBlogPosts(), ...getStaticPages()]
    .map(p => `   - ${p.path} — ${p.title}`)
    .join('\n');
  return `Ти си професионален копирайтър за български сайт за 3D принтиране (3dpechat.bg).
Напиши информативна, практична и SEO-оптимизирана статия на български език по темата:

ТЕМА: "${topic}"
КОНТЕКСТ/РЕЗЮМЕ: ${summary || '(няма)'}
ИЗТОЧНИК НА ИДЕЯТА: ${sourceUrl || '(няма)'}
ПРЕДЛОЖЕН SLUG: ${suggestedSlug}
${products ? `\nСВЪРЗАНИ ПРОДУКТИ ОТ КАТАЛОГА НА САЙТА: ${products}.
Статията трябва естествено да насочва читателя към тях: поне веднъж линкни [нашите продукти](/products/), а при поръчка по индивидуален модел — [заяви оферта](/contact/). Не измисляй цени и продукти, които не са изброени тук.\n` : ''}
ТЕКУЩА ГОДИНА: ${year}. Не описвай минали години като бъдеще (напр. „след 2024“) — пиши спрямо текущата година.

ФАКТИ ЗА НАШИЯ БИЗНЕС (${business.name}) — единственият източник за нашите услуги, цени, срокове, материали и доставка:
${business.facts.map(f => `- ${f}`).join('\n')}
НИКОГА НЕ ТВЪРДИ (дори косвено):
${business.neverClaim.map(c => `- ${c}`).join('\n')}
Когато статията говори за нашите услуги, използвай само фактите по-горе. Ако нещо не е там — не го обещавай.

ИЗИСКВАНИЯ ЗА СТАТИЯТА (markdown):
1. Започни с "# " и заглавието (на български).
2. На следващия ред: "**Време за четене: X мин.**" (преценено реалистично).
3. Използвай "##" за основни раздели и "###" за подсекции.
4. Дължина: 1500–2500 думи. Практичен и информативен тон.
5. Включи поне една markdown таблица, поне един blockquote (> ...), bullet списъци.
6. НЕ включвай никакви изображения (![...](...)) в markdown тялото — изображенията ще бъдат добавени ръчно по-късно.
7. Използвай български кавички „така" вместо "така".
8. Споменавай естествено ключовите фрази: "3D принтиране", "3D принтер", "3D печат".
9. Завърши с раздел "## Заключение" и call-to-action, който приканва читателя да "свържете се с нас" за 3D печат услуги в България.
10. Не включвай HTML, само markdown.
11. ЗАДЪЛЖИТЕЛНО добави поне 2 вътрешни линка към други блог статии от сайта, когато тематично са релевантни.
12. Използвай root-relative вътрешни линкове в markdown формат, завършващи с "/", например: [Какво е 3D принтиране](/blog/what-is-3d-printing/).
    Линквай САМО към страниците от този списък — други адреси не съществуват и ще бъдат премахнати:
${linkTargets}
13. Предпочитай естествени вътрешни линкове към материали, технологии, приложения, постобработка, локални услуги и бизнес теми, когато са логично свързани със статията.
14. Всички суми пиши САМО в евро (€), например „12 €“ — никога в лева: България е в еврозоната от 2026 г.
15. Ако включиш раздел с често задавани въпроси (препоръчително, 3–5 въпроса преди заключението), озаглави го точно „## Често задавани въпроси“, всеки въпрос като „### …?“, а отговорът — като абзац под него. Сайтът превръща този раздел в FAQPage schema дума по дума, затова отговорите трябва да са верни и самостоятелни.

ИЗИСКВАНИЯ ЗА SEO МЕТАДАННИ:
- title: 50–60 символа, включва ключова дума, на български.
- description: 150–160 символа, на български, мотивиращ клик.
- keywords: 6–10 ключови фрази, разделени със запетая (на български/латински, миксирано е ОК).
- tags: масив от 4–8 кратки тага на български.
- slug: kebab-case, латиница, по възможност използвай "${suggestedSlug}".

- imagePrompt: кратко описание на EN (max 20 думи) за генериране на cover изображение — фотореалистична сцена свързана с темата.

ОТГОВОРИ в точно следния формат — НИКАКЪВ друг текст извън него:

===JSON===
{"slug":"...","title":"...","description":"...","keywords":"kw1, kw2","tags":["tag1","tag2"],"imagePrompt":"..."}
===MARKDOWN===
# Заглавие
**Време за четене: X мин.**

...съдържание...`;
}

function parseResponse(text) {
  const jsonMarker = '===JSON===';
  const mdMarker = '===MARKDOWN===';

  const jsonStart = text.indexOf(jsonMarker);
  const mdStart = text.indexOf(mdMarker);

  // Preferred: delimited format.
  if (jsonStart !== -1 && mdStart !== -1) {
    const jsonRaw = text.slice(jsonStart + jsonMarker.length, mdStart).trim();
    const markdown = text.slice(mdStart + mdMarker.length).trim();
    // Strip code fences that sometimes wrap the JSON block.
    const cleaned = jsonRaw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    const meta = JSON.parse(cleaned);
    return { meta, markdown };
  }

  // Fallback: try to parse whole response as JSON (old behaviour).
  console.warn('[generate-article] delimiters not found, falling back to JSON parse');
  let t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const first = t.indexOf('{');
  const last = t.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('No JSON object in AI response');
  const meta = JSON.parse(t.slice(first, last + 1));
  // markdown may be embedded in the JSON or absent.
  return { meta, markdown: String(meta.markdown || '').replace(/\\n/g, '\n') };
}

async function generateArticle(topicObj) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY env var is required');

  let Anthropic;
  try {
    Anthropic = require('@anthropic-ai/sdk');
  } catch {
    throw new Error('@anthropic-ai/sdk is not installed. Run: npm install --save-dev @anthropic-ai/sdk');
  }

  const client = Anthropic.default ? new Anthropic.default({ apiKey }) : new Anthropic({ apiKey });
  const prompt = buildPrompt(topicObj);

  console.log(`[generate-article] requesting article from ${MODEL}…`);
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n');

  const { meta, markdown: rawMarkdown } = parseResponse(text);

  // Strip any image lines Claude may have included despite the instruction.
  const withoutImages = rawMarkdown
    .replace(/^\s*!\[.*?\]\(.*?\)\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const { markdown, dropped } = fixInternalLinks(withoutImages);
  if (dropped.length) {
    console.warn(`[generate-article] unwrapped ${dropped.length} link(s) to non-existent pages: ${dropped.join(', ')}`);
  }

  // A locked slug (service-topics.js) wins over the model's suggestion, so the
  // topic dedupe in scrape-ideas.js stays exact.
  const finalSlug = cleanSlug(slugify(
    (topicObj.lockSlug && topicObj.suggestedSlug) || meta.slug || topicObj.suggestedSlug || topicObj.topic
  ));
  if (!finalSlug) throw new Error('Failed to derive a valid slug');

  const publishDate = new Date().toISOString().slice(0, 10);

  return {
    slug: finalSlug,
    markdown: markdown.replace(/\r\n/g, '\n'),
    seo: {
      title: String(meta.title || topicObj.topic).trim(),
      description: String(meta.description || '').trim(),
      keywords: String(meta.keywords || '').trim(),
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      imagePrompt: String(meta.imagePrompt || `3D printing ${topicObj.topic}`).trim(),
      publishDate
    },
    source: {
      url: topicObj.sourceUrl,
      topic: topicObj.topic
    }
  };
}

module.exports = { generateArticle, cleanSlug, buildPrompt };
