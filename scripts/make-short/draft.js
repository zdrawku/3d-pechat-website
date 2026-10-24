/**
 * Asks Claude for a short's storyboard: it sees the product text, the
 * business facts and the previews of every photo and clip frame, and returns
 * the beats as JSON (structured output). Used by the GitHub workflow; a local
 * `/make-short` run has Claude Code write the spec itself instead.
 *
 * Env: ANTHROPIC_API_KEY; SHORTS_MODEL overrides the model.
 */
const fs = require('fs');
const lib = require('./lib');
const { publicMedia } = require('./collect');

const MODEL = process.env.SHORTS_MODEL || 'claude-opus-5-5';

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['beats', 'endCard', 'post'],
  properties: {
    beats: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['source', 'start', 'caption', 'highlight', 'voiceover'],
        properties: {
          source: { type: 'string' },
          start: { type: 'number' },
          caption: { type: 'string' },
          highlight: { type: 'string' },
          voiceover: { type: 'string' },
        },
      },
    },
    endCard: {
      type: 'object',
      additionalProperties: false,
      required: ['line', 'voiceover'],
      properties: { line: { type: 'string' }, voiceover: { type: 'string' } },
    },
    post: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'description', 'hashtags'],
      properties: { title: { type: 'string' }, description: { type: 'string' }, hashtags: { type: 'array', items: { type: 'string' } } },
    },
  },
};

function instructions({ product, business, idea, note, voice }) {
  return `You write the storyboard for a 15–20 second vertical short (TikTok, YouTube Shorts, Instagram Reels) for 3dpechat.bg, a 3D-printing workshop in Sofia. Everything on screen and in the voice is in Bulgarian.

Product: ${product.name}
Description: ${product.description}
Tags: ${(product.tags || []).join(', ')}
Request from the team: ${idea || '—'}${note ? `\nFeedback on the previous draft, apply it: ${note}` : ''}

The only claims you may make besides the product text are these facts:
${business.facts.map((f) => `- ${f}`).join('\n')}
Never claim:
${business.neverClaim.map((c) => `- ${c}`).join('\n')}

Write 3 beats, then the end card.
- Open with a clip when there is one: movement in the first second keeps people watching. Photos fill the other beats. Use each source at most twice.
- source: a media id from the list below. start: for a clip, the second where its best 2–4 seconds begin, read from the frame times; for a photo, 0.
- caption: at most 6 words and 40 characters — a hook or one concrete fact. No emoji. highlight: one or two words copied exactly from the caption; they are shown in orange.
- voiceover: ${voice ? 'one short sentence of at most 12 words that adds to the caption.' : 'always "" (this short has music only).'}
- Describe only what the frames show or the product text states. Numbers only from the facts or the product text; amounts in euro.
- endCard.line: at most 6 words, e.g. "Отпечатан на 3D принтер в София". endCard.voiceover: ${voice ? 'one short sentence ending with "3dpechat.bg".' : '"".'}
- post.title: at most 70 characters. post.description: one or two sentences ending with "Безплатна оферта на 3dpechat.bg". post.hashtags: 5–8, Bulgarian and English, including #3dпечат and #3dprinting.

Media:`;
}

/** The user message: instructions, then each media item labelled and shown. */
function buildContent(args) {
  const { manifest } = args;
  const content = [{ type: 'text', text: instructions(args) }];
  for (const [id, m] of Object.entries(manifest.media)) {
    const label = m.kind === 'video'
      ? `${id} — клип, ${m.duration} s (${m.name}). Кадри:`
      : `${id} — снимка (${m.name}):`;
    content.push({ type: 'text', text: label });
    for (const p of manifest.previews.filter((x) => x.id === id)) {
      if (p.t !== undefined) content.push({ type: 'text', text: `${id} @ ${p.t} s` });
      content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: fs.readFileSync(p.file).toString('base64') } });
    }
  }
  return content;
}

/** Problems with a draft: structure first, then the facts check. */
function reviewDraft(spec, { product, business, idea }) {
  return [
    ...lib.validateSpec(spec),
    ...lib.factsCheck(lib.specTexts(spec), { facts: business.facts, sources: [product.name, product.description, idea] }),
  ];
}

async function askClaude(client, content) {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // Server-side fallback: a policy decline is retried on the fallback model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
    messages: [{ role: 'user', content }],
  });
  if (response.stop_reason === 'refusal') throw new Error(`Claude declined to draft this short (${(response.stop_details && response.stop_details.category) || 'no category'}).`);
  if (response.stop_reason === 'max_tokens') throw new Error('Claude ran out of tokens before finishing the storyboard.');
  return JSON.parse(response.content.filter((b) => b.type === 'text').map((b) => b.text).join(''));
}

/**
 * @returns { spec, problems } — problems is empty when the draft passed;
 *          otherwise it lists what was still wrong after one retry.
 */
async function draftSpec({ product, manifest, idea = '', note = '', voice }) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new (Anthropic.default || Anthropic)();
  const business = lib.readBusiness();
  const content = buildContent({ product, business, manifest, idea, note, voice });
  const wrap = (draft) => ({ product: product.linkId, voice, idea, media: publicMedia(manifest), ...draft });

  let spec = wrap(await askClaude(client, content));
  let problems = reviewDraft(spec, { product, business, idea });
  if (problems.length) {
    console.log(`[make-short] first draft had ${problems.length} problem(s), retrying:\n${problems.join('\n')}`);
    const retry = [...content, { type: 'text', text: `A previous draft had these problems. Avoid them:\n${problems.map((p) => `- ${p}`).join('\n')}` }];
    spec = wrap(await askClaude(client, retry));
    problems = reviewDraft(spec, { product, business, idea });
  }
  return { spec, problems };
}

module.exports = { draftSpec, buildContent, reviewDraft, SCHEMA, MODEL };
