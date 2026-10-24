/**
 * Pure helpers for the shorts pipeline (FEATURE-IDEAS-PLAN.md, Idea 8): issue
 * parsing, the storyboard ("spec") format, the facts check and the ffmpeg
 * filter strings. No network and no ffmpeg here, so all of it is unit-tested.
 *
 * A spec is the storyboard Claude drafts and a person approves:
 *   { product, voice, media: { m1: {kind, origin, ref, name, duration?} },
 *     beats: [{ source, start, caption, highlight, voiceover }],
 *     endCard: { line, voiceover }, post: { title, description, hashtags } }
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SIZE = { width: 1080, height: 1920, fps: 30 };

/** Issue-form labels — the generator writes them, the parser reads them back. */
const FORM = {
  product: 'Продукт',
  media: 'Снимки и клипове',
  drive: 'Google Drive',
  driveOption: 'Използвай и папката на продукта в Google Drive',
  idea: 'Идея (по избор)',
  voice: 'Глас',
};

/** Dropdown label → edge-tts voice (null = music only). First one is the default. */
const VOICES = {
  'Калина (женски)': 'bg-BG-KalinaNeural',
  'Борислав (мъжки)': 'bg-BG-BorislavNeural',
  'Без глас (само музика)': null,
};

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const readProducts = () => readJson('src/data/products.json');
const readBusiness = () => readJson('src/data/business.json');

/** GitHub issue forms render each field as `### Label` + value. Keys are lowercased labels. */
function parseIssueForm(body) {
  const sections = {};
  for (const part of String(body || '').split(/^###\s+/m).slice(1)) {
    const nl = part.indexOf('\n');
    const label = (nl === -1 ? part : part.slice(0, nl)).trim().toLowerCase();
    sections[label] = (nl === -1 ? '' : part.slice(nl + 1)).trim();
  }
  return sections;
}

/** GitHub renders an unfilled optional field as this literal. */
function clean(value) {
  if (!value || value.trim() === '_No response_') return '';
  return value.trim();
}

/**
 * Files dropped into an issue live on these hosts only. Anything else in the
 * text (a link someone pasted) is never downloaded.
 */
function isAttachmentUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  if (url.hostname === 'github.com') {
    return /^\/user-attachments\/(assets|files)\/[\w-]+/.test(url.pathname)
      || /^\/[\w.-]+\/[\w.-]+\/assets\/\d+\/[\w-]+/.test(url.pathname);
  }
  return ['private-user-images.githubusercontent.com', 'user-images.githubusercontent.com'].includes(url.hostname);
}

/**
 * Every attachment URL in a form field, in the order they appear. Covers the
 * shapes GitHub emits: `![x](url)`, `<img src="url">`, `[name.mp4](url)` and a
 * bare video URL on its own line.
 */
function extractAttachmentUrls(value) {
  const found = String(value || '').match(/https:\/\/[^\s"'<>()\]]+/g) || [];
  return [...new Set(found.filter(isAttachmentUrl))];
}

const normalize = (s) => String(s || '').toLowerCase().replace(/[—–-]/g, ' ').replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();

/** A product by exact linkId or by its name (case, dashes and punctuation ignored). */
function findProduct(products, query) {
  const q = String(query || '').trim();
  if (!q) return null;
  return products.find((p) => p.linkId === q)
    || products.find((p) => normalize(p.name) === normalize(q))
    || null;
}

/** Reads a `🎬 Ново кратко видео` issue. Returns the request plus any problems found. */
function parseShortIssue(body, products) {
  const f = parseIssueForm(body);
  const get = (label) => clean(f[label.toLowerCase()]);
  const errors = [];

  const productLabel = get(FORM.product);
  const product = findProduct(products, productLabel);
  if (!product) errors.push(`Не намирам продукта „${productLabel || '—'}“ в products.json.`);

  const voiceLabel = get(FORM.voice);
  const voice = voiceLabel in VOICES ? VOICES[voiceLabel] : Object.values(VOICES)[0];

  return {
    product,
    attachmentUrls: extractAttachmentUrls(get(FORM.media)),
    useDrive: /\[x\]/i.test(get(FORM.drive)),
    idea: get(FORM.idea),
    voice,
    errors,
  };
}

/** `/render` or `/redo <note>` on the first line of a comment; anything else is ignored. */
function parseCommand(body) {
  const text = String(body || '').trim();
  const m = text.match(/^\/(render|redo)\b([\s\S]*)$/i);
  if (!m) return null;
  return { cmd: m[1].toLowerCase(), note: m[2].trim() };
}

// The approved storyboard travels between workflow runs inside the bot's
// comment. Base64 keeps `-->` or backticks in captions from breaking it.
const SPEC_MARKER = 'make-short-spec';
const embedSpec = (spec) => `<!-- ${SPEC_MARKER}\n${Buffer.from(JSON.stringify(spec), 'utf8').toString('base64')}\n-->`;
function extractSpec(body) {
  const m = String(body || '').match(new RegExp(`<!-- ${SPEC_MARKER}\\n([A-Za-z0-9+/=]+)\\n-->`));
  return m ? JSON.parse(Buffer.from(m[1], 'base64').toString('utf8')) : null;
}

const numbersIn = (text) => String(text || '').match(/\d+(?:[.,]\d+)?/g) || [];

/**
 * What a short may not say (CLAUDE.md Rule 5) — the same guards as
 * src/data/faq.spec.ts, plus euro-only amounts (Rule 6).
 */
const NEVER = [
  [/\bSLA\b|\bSLS\b|\bMJF\b|смола/i, 'не печатаме със смола (SLA/SLS/MJF)'],
  [/сканиран/i, '3D сканиране не предлагаме'],
  [/същия ден|днес за днес/i, 'не обещаваме изработка в същия ден'],
  // `\b` only knows Latin letters, so the Cyrillic boundary is spelled out.
  [/(^|[^\p{L}])лв(?!\p{L})|лева/iu, 'суми само в евро'],
];

/**
 * Checks on-screen and spoken text against the facts. Every number must
 * appear in business.json facts or in the request's own sources (product
 * text, the requester's note). Returns a list of problems, empty when fine.
 */
function factsCheck(texts, { facts, sources = [] }) {
  const allowed = new Set(numbersIn([...facts, ...sources].join(' ')));
  const problems = [];
  for (const text of texts.filter(Boolean)) {
    const unknown = numbersIn(text).filter((n) => !allowed.has(n));
    if (unknown.length) problems.push(`„${text}“: числото ${unknown.join(', ')} го няма във фактите`);
    for (const [re, why] of NEVER) if (re.test(text)) problems.push(`„${text}“: ${why}`);
    if (/фактур/i.test(text) && !/не издаваме фактури/i.test(text)) problems.push(`„${text}“: не издаваме фактури`);
  }
  return problems;
}

/** Every text in a spec that ends up on screen, in the voice or in the post. */
function specTexts(spec) {
  return [
    ...spec.beats.flatMap((b) => [b.caption, b.voiceover]),
    spec.endCard.line, spec.endCard.voiceover,
    spec.post.title, spec.post.description,
  ];
}

/** Structural checks on a drafted spec. Returns a list of problems, empty when fine. */
function validateSpec(spec) {
  const problems = [];
  const media = spec.media || {};
  if (!Array.isArray(spec.beats) || spec.beats.length < 2 || spec.beats.length > 5) {
    return ['Трябват между 2 и 5 кадъра.'];
  }
  spec.beats.forEach((b, i) => {
    const n = i + 1;
    const m = media[b.source];
    if (!m) problems.push(`Кадър ${n}: няма източник „${b.source}“.`);
    else if (m.kind === 'video' && !(b.start >= 0 && b.start < Math.max(0.5, (m.duration || 0) - 0.5))) {
      problems.push(`Кадър ${n}: началото ${b.start} s е извън клипа (${m.duration} s).`);
    }
    if (!b.caption || b.caption.length > 60) problems.push(`Кадър ${n}: надписът трябва да е 1–60 знака.`);
    if (b.highlight && !b.caption.includes(b.highlight)) problems.push(`Кадър ${n}: акцентът „${b.highlight}“ не е в надписа.`);
    if ((b.voiceover || '').length > 160) problems.push(`Кадър ${n}: гласът е твърде дълъг.`);
  });
  if (!spec.endCard || !spec.endCard.line || spec.endCard.line.length > 60) problems.push('Финалният кадър: редът трябва да е 1–60 знака.');
  if (!spec.post || !spec.post.title || !Array.isArray(spec.post.hashtags)) problems.push('Липсва текст за публикуване.');
  else if (spec.post.hashtags.some((h) => !/^#\S+$/.test(h))) problems.push('Хаштаговете трябва да започват с # и да са без интервали.');
  return problems;
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Seconds a beat stays on screen: long enough for its voice line, never a slog. */
const beatDuration = (voiceSeconds) => (voiceSeconds ? clamp(voiceSeconds + 0.45, 2.5, 7) : 3);
const endCardDuration = (voiceSeconds) => (voiceSeconds ? clamp(voiceSeconds + 0.6, 3, 6) : 3.5);

/**
 * ffmpeg filter for one clip beat. Input 0 is the clip (already trimmed with
 * -ss/-t), input 1 the transparent caption PNG. Upright clips fill the frame;
 * landscape or square ones sit on a blurred copy of themselves so the product
 * isn't cropped away.
 */
function clipFilter({ width, height }, seconds) {
  const tail = `fps=${SIZE.fps},setsar=1,tpad=stop_mode=clone:stop_duration=${seconds},trim=duration=${seconds},setpts=PTS-STARTPTS,format=yuv420p`;
  const cover = `scale=${SIZE.width}:${SIZE.height}:force_original_aspect_ratio=increase,crop=${SIZE.width}:${SIZE.height}`;
  const base = height / width >= 1.5
    ? `[0:v]${cover},${tail}[base]`
    : `[0:v]split[a][b];[a]${cover},boxblur=24:2,eq=brightness=-0.06[bg];[b]scale=${SIZE.width}:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,${tail}[base]`;
  return `${base};[base][1:v]overlay=0:0[v]`;
}

/**
 * ffmpeg filter for one photo beat: a slow 10 % zoom. Input 0 is the photo
 * pre-scaled to twice the output size (less zoompan jitter), input 1 the
 * caption PNG. Alternate beats zoom out so a run of photos doesn't feel stuck.
 */
function photoFilter(seconds, zoomIn = true) {
  const frames = Math.round(seconds * SIZE.fps);
  const z = zoomIn ? `1+0.10*on/${frames}` : `1.10-0.10*on/${frames}`;
  return `[0:v]zoompan=z='${z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${SIZE.width}x${SIZE.height}:fps=${SIZE.fps},setsar=1,format=yuv420p[base];[base][1:v]overlay=0:0[v]`;
}

/** The text to paste under the video on TikTok, YouTube Shorts and Reels. */
function postText(spec) {
  return `${spec.post.title}\n\n${spec.post.description}\n\n${spec.post.hashtags.join(' ')}\n`;
}

/**
 * The product's subfolder inside the shared Drive folder: named after its
 * linkId or its catalog name. `_music` and other `_` folders are never matched.
 */
function pickProductFolder(folders, product) {
  const own = folders.filter((f) => !f.name.startsWith('_'));
  return own.find((f) => f.name.trim().toLowerCase() === product.linkId)
    || own.find((f) => normalize(f.name) === normalize(product.name))
    || null;
}

/** `@handle` for TikTok and YouTube from business.json sameAs, for the end card. */
function socialHandles(business) {
  const find = (re) => (business.sameAs || []).map((u) => u.match(re)).find(Boolean);
  const tiktok = find(/tiktok\.com\/@([^/?#]+)/);
  const youtube = find(/youtube\.com\/@([^/?#]+)/);
  return [tiktok && `@${tiktok[1]}`, youtube && `YouTube @${youtube[1]}`].filter(Boolean).join(' · ');
}

module.exports = {
  ROOT, SIZE, FORM, VOICES,
  readProducts, readBusiness,
  parseIssueForm, clean, isAttachmentUrl, extractAttachmentUrls, findProduct, parseShortIssue, parseCommand,
  SPEC_MARKER, embedSpec, extractSpec,
  numbersIn, factsCheck, specTexts, validateSpec,
  beatDuration, endCardDuration, clipFilter, photoFilter, postText,
  pickProductFolder, socialHandles,
};
