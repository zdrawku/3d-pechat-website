/**
 * Pure helpers for the shorts pipeline (FEATURE-IDEAS-PLAN.md, Idea 8): issue
 * parsing, the storyboard ("spec") format, the facts check and the ffmpeg
 * filter strings. No network and no ffmpeg here, so all of it is unit-tested.
 *
 * A spec is the storyboard the agent writes (spec.json in the work folder):
 *   { product?, media: { m1: {kind, origin, ref, name, duration?} },
 *     beats: [{ source, start, seconds?, position?, caption, highlight }],
 *     endCard: { line }, post: { link, tiktok, youtube, pinnedComment } }
 * Text only: no voice and no music (the team adds a sound in the app).
 * `media` is filled in from manifest.json; the agent writes the rest.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SIZE = { width: 1080, height: 1920, fps: 30 };

/** Issue-form labels (.github/ISSUE_TEMPLATE/new-short.yml) — the parser reads them back. */
const FORM = {
  request: 'Какво видео искаш?',
  media: 'Снимки и клипове (по избор)',
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
 * Files dropped into an issue or comment live on these hosts only. Anything
 * else in the text (a link someone pasted) is never downloaded.
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
 * Every attachment URL in a text, in order. Covers the shapes GitHub emits:
 * `![x](url)`, `<img src="url">`, `[name.mp4](url)` and a bare video URL.
 */
function extractAttachmentUrls(text) {
  const found = String(text || '').match(/https:\/\/[^\s"'<>()\]]+/g) || [];
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

/** Reads a `🎬 Ново кратко видео` issue body: the request in words, plus attachments. */
function parseShortIssue(body) {
  const f = parseIssueForm(body);
  const request = clean(f[FORM.request.toLowerCase()]);
  return {
    request,
    attachmentUrls: extractAttachmentUrls(f[FORM.media.toLowerCase()] || body),
    errors: request ? [] : ['Липсва описание какво видео искаш.'],
  };
}

const PLATFORM_LINK = /https?:\/\/([\w-]+\.)*(tiktok\.com|youtube\.com|youtu\.be|instagram\.com|facebook\.com|fb\.watch)\//i;
// `\b` only knows Latin letters, so the Cyrillic boundaries are spelled out.
const UPLOADED_WORD = /(^|[^\p{L}])(качено|качен[аи]?|качих(ме)?|публикуван[оаи]?|публикувах(ме)?)(?!\p{L})/iu;

/**
 * The team's „it's published“ comment, which closes the issue instead of
 * starting a new version: one that starts with „качено“ (any case, link or
 * not), or any upload word plus the video's link on TikTok, YouTube,
 * Instagram or Facebook („https://vm.tiktok.com/… Качих го“). „Качих нов
 * клип“ (a file for the agent) has no platform link and stays feedback, as
 * does a reference link on its own. Who wrote it is checked separately (only
 * the team's comments get here).
 */
function isUploadedNote(body) {
  const text = String(body || '').trim();
  return /^[^\p{L}\p{N}]*качено(?!\p{L})/iu.test(text) || (UPLOADED_WORD.test(text) && PLATFORM_LINK.test(text));
}

// The agent's storyboard and recording scripts travel between workflow runs
// inside the bot's comment, so feedback can build on them. Base64 keeps `-->`
// or backticks in captions from breaking the HTML comment.
const STATE_MARKER = 'make-short-state';
const embedState = (state) => `<!-- ${STATE_MARKER}\n${Buffer.from(JSON.stringify(state), 'utf8').toString('base64')}\n-->`;
function extractState(body) {
  const m = String(body || '').match(new RegExp(`<!-- ${STATE_MARKER}\\n([A-Za-z0-9+/=]+)\\n-->`));
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
 * text, the requester's words). Returns a list of problems, empty when fine.
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

/** Every text in a spec that ends up on screen or in the upload copy. */
function specTexts(spec) {
  const post = spec.post || {};
  return [
    ...spec.beats.map((b) => b.caption),
    spec.endCard.line,
    post.tiktok && post.tiktok.caption,
    ...((post.tiktok && post.tiktok.hashtags) || []),
    post.youtube && post.youtube.title,
    post.youtube && post.youtube.description,
    ...((post.youtube && post.youtube.tags) || []),
    post.pinnedComment,
  ];
}

/**
 * What the shorts never say in public — the repo, its issues and the drafts
 * release are public. The agent is told the same (agent-rules.md); this is
 * the backstop that holds even when it doesn't listen. Each entry is
 * [pattern, why] and applies to captions, upload copy, typed text and the
 * agent's message.
 */
const OFF_LIMITS = [
  [/claude|anthropic|openai|chatgpt|\bgpt|\bllm\b|\bsonnet\b|\bopus\b|\bhaiku\b/i, 'не говорим за инструментите зад видеата'],
  [/абонамент|subscription|api[ _-]?key|access[ _-]?token|oauth|парол[аи]|password|credential/i, 'не говорим за акаунти и ключове'],
  [/github|workflow|репозитори|repository|\bnpm\b|node_modules|\.git\b/i, 'не говорим за кода и как работи'],
  [/(^|[\s(`'"])\.?(src|scripts|tmp|\.claude|\.github)\/|\b[\w-]+\.(js|ts|json|ya?ml|md|env|sh)\b/i, 'без имена на файлове'],
  [/gh[pousr]_[A-Za-z0-9]{20,}|sk-ant-|-----BEGIN|[A-Za-z0-9+/]{40,}/, 'прилича на ключ'],
  [/https?:\/\/|www\.|<[a-z!/]|\]\(|```/i, 'без http линкове и код'],
  [/здравко|колев|zdravko|kolev|zdrawku|zdkolev|mariyajablqnova/i, 'без имена на екипа'],
];

/**
 * Problems with one public text, empty when fine. E-mail addresses are
 * refused except the business's own and example.com ones (typed into the
 * contact form in recordings).
 */
function offLimits(text, { email = '' } = {}) {
  const t = String(text || '');
  const problems = OFF_LIMITS.filter(([re]) => re.test(t)).map(([, why]) => why);
  const emails = t.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g) || [];
  if (emails.some((e) => e.toLowerCase() !== email.toLowerCase() && !/@example\.(com|org)$/i.test(e))) problems.push('без имейл адреси');
  return problems;
}

/** offLimits() over every public text of a spec, as `check` problems. */
function scopeCheck(texts, opts) {
  return texts.filter(Boolean).flatMap((text) => offLimits(text, opts).map((why) => `„${text}“: ${why}`));
}

/** What the reply says instead of an agent message that didn't pass. */
const NEUTRAL_MESSAGE = 'Правя само кратки видеа за продуктите, услугите и сайта на 3dpechat.bg — опиши какво видео искаш.';

/**
 * The agent's message (result.md) as it may appear in the public reply:
 * short, plain Bulgarian, nothing off limits, no mentions. Anything else is
 * replaced by a neutral line — the reason is only returned, never posted.
 */
function publicMessage(message, opts) {
  const text = String(message || '').trim();
  if (!text) return { text: '', withheld: [] };
  const withheld = offLimits(text, opts);
  if (/(^|\s)@[\w-]/.test(text)) withheld.push('споменаване (@)');
  if (text.length > 1500 || text.split('\n').length > 16) withheld.push('твърде дълго');
  return withheld.length ? { text: NEUTRAL_MESSAGE, withheld } : { text, withheld };
}

/**
 * The storyboard and recording scripts carried to the next round inside the
 * bot's (public) comment — only the fields the pipeline knows, so nothing
 * else the agent wrote into its files travels along.
 */
function nextRoundState(spec, flows) {
  const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o && o[k] !== undefined).map((k) => [k, o[k]]));
  const post = spec.post || {};
  return {
    spec: {
      ...pick(spec, ['product']),
      beats: (spec.beats || []).map((b) => pick(b, ['source', 'start', 'seconds', 'position', 'caption', 'highlight'])),
      endCard: pick(spec.endCard, ['line']),
      post: {
        ...pick(post, ['pinnedComment']),
        tiktok: pick(post.tiktok, ['caption', 'hashtags']),
        youtube: pick(post.youtube, ['title', 'description', 'tags']),
      },
    },
    flows: Object.fromEntries(Object.entries(flows || {}).map(([name, flow]) => [name, pick(flow, ['baseUrl', 'dark', 'steps'])])),
  };
}

const HASHTAG = /^#[\p{L}\p{N}_]+$/u;

/**
 * The upload copy (spec.post) — what goes under the video on each platform:
 *   { tiktok: { caption, hashtags: [] },              also used for Instagram Reels
 *     youtube: { title, description, tags: [] },
 *     pinnedComment }
 * No http links: a page of the site is written out as text
 * („3dpechat.bg/contact“).
 * Returns a list of problems, empty when fine.
 */
function validatePost(post) {
  if (!post || !post.tiktok || !post.youtube) return ['Липсва текстът за качване (post.tiktok и post.youtube).'];
  const problems = [];
  const { tiktok, youtube } = post;
  const caption = String(tiktok.caption || '');
  if (caption.length < 20 || caption.length > 1000) problems.push('TikTok: текстът трябва да е 20–1000 знака.');
  if (caption.split('\n')[0].length > 100) problems.push('TikTok: първият ред (куката) трябва да е до 100 знака — толкова се вижда преди „още“.');
  if (/#/.test(caption)) problems.push('TikTok: хаштаговете са в tiktok.hashtags, не в текста.');
  const tags = tiktok.hashtags || [];
  if (tags.length < 3 || tags.length > 8) problems.push('TikTok: 3–8 хаштага.');
  if (tags.some((h) => !HASHTAG.test(h))) problems.push('Хаштаговете започват с # и са една дума (букви, цифри, _).');
  if (tags.some((h) => /^#(fyp|foryou|foryoupage|viral|xyzbca)$/i.test(h))) problems.push('Без #fyp/#viral — не помагат, а изглеждат като спам.');
  const title = String(youtube.title || '');
  if (title.length < 10 || title.length > 100) problems.push('YouTube: заглавието трябва да е 10–100 знака.');
  const description = String(youtube.description || '');
  if (description.length < 20 || description.length > 3000) problems.push('YouTube: описанието трябва да е 20–3000 знака.');
  if ([caption, title, description, post.pinnedComment].some((t) => /https?:\/\/|www\./i.test(String(t || '')))) {
    problems.push('Без http линкове в текста за качване — адресът се пише като текст: 3dpechat.bg/contact.');
  }
  const ytTags = youtube.tags || [];
  if (ytTags.length < 5 || ytTags.length > 20 || ytTags.some((t) => !t || t.includes('#') || t.includes(','))) problems.push('YouTube: 5–20 тага, без # и без запетаи.');
  if (ytTags.join(',').length > 450) problems.push('YouTube: таговете са общо до 450 знака.');
  const pinned = String(post.pinnedComment || '');
  if (pinned.length < 5 || pinned.length > 300) problems.push('Закаченият коментар трябва да е 5–300 знака.');
  return problems;
}

/** Structural checks on a spec. Returns a list of problems, empty when fine. */
function validateSpec(spec) {
  const problems = [];
  const media = spec.media || {};
  if (!Array.isArray(spec.beats) || spec.beats.length < 2 || spec.beats.length > 6) {
    return [...problems, 'Трябват между 2 и 6 кадъра.'];
  }
  spec.beats.forEach((b, i) => {
    const n = i + 1;
    const m = media[b.source];
    if (!m) problems.push(`Кадър ${n}: няма източник „${b.source}“.`);
    else if (m.kind === 'video' && !(b.start >= 0 && b.start < Math.max(0.5, (m.duration || 0) - 0.5))) {
      problems.push(`Кадър ${n}: началото ${b.start} s е извън клипа (${m.duration} s).`);
    }
    if (b.seconds !== undefined && !(b.seconds >= 1.5 && b.seconds <= 8)) problems.push(`Кадър ${n}: seconds трябва да е между 1,5 и 8.`);
    if (b.position !== undefined && !['middle', 'top'].includes(b.position)) problems.push(`Кадър ${n}: position е "middle" или "top".`);
    if (!b.caption || b.caption.length > 60) problems.push(`Кадър ${n}: надписът трябва да е 1–60 знака.`);
    if (b.highlight && !b.caption.includes(b.highlight)) problems.push(`Кадър ${n}: акцентът „${b.highlight}“ не е в надписа.`);
  });
  if (!spec.endCard || !spec.endCard.line || spec.endCard.line.length > 60) problems.push('Финалният кадър: редът трябва да е 1–60 знака.');
  return [...problems, ...validatePost(spec.post)];
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Seconds a beat stays on screen: long enough to read its caption (about
 * 1.5 s plus 0.06 s per character) or, for a recorded website step, as long
 * as the agent asked for (`seconds`), within 2.5–8 s.
 */
function beatDuration(caption, wanted) {
  const toRead = 1.5 + 0.06 * String(caption || '').length;
  return Math.round(clamp(Math.max(toRead, wanted || 0), 2.5, 8) * 100) / 100;
}

/** The end card's length (logo, site, offer). */
const END_CARD_SECONDS = 3.5;

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

/**
 * The copy to paste on each platform, finished: hashtags appended, and on
 * YouTube the first three plus #shorts (they show above the title).
 */
function uploadCopy(spec) {
  const { tiktok, youtube, pinnedComment } = spec.post;
  return {
    tiktok: `${tiktok.caption.trim()}\n\n${tiktok.hashtags.join(' ')}`,
    youtubeTitle: youtube.title.trim(),
    youtubeDescription: `${youtube.description.trim()}\n\n${[...tiktok.hashtags.slice(0, 3), '#shorts'].join(' ')}`,
    youtubeTags: youtube.tags.join(', '),
    pinnedComment: pinnedComment.trim(),
  };
}

/** post.txt: everything to paste when uploading, in the order you need it. */
function postText(spec) {
  const c = uploadCopy(spec);
  return [
    '=== TikTok (и Instagram Reels) — описание ===',
    c.tiktok,
    '',
    '=== YouTube Shorts ===',
    'Заглавие:',
    c.youtubeTitle,
    '',
    'Описание:',
    c.youtubeDescription,
    '',
    'Тагове (поле „Тагове“ / Tags):',
    c.youtubeTags,
    '',
    '=== Закачен коментар (напиши го първи и го закачи) ===',
    c.pinnedComment,
    '',
    'Съвети:',
    '- Видеото е без звук: при качване добави популярен звук от библиотеката на TikTok / YouTube — така видеото се показва и на хората, които следят този звук.',
    '- Отговаряй на коментарите през първия час — тогава платформите решават дали да покажат видеото на повече хора.',
    '',
  ].join('\n');
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
  ROOT, SIZE, FORM, END_CARD_SECONDS,
  readProducts, readBusiness,
  parseIssueForm, clean, isAttachmentUrl, extractAttachmentUrls, findProduct, parseShortIssue, isUploadedNote,
  STATE_MARKER, embedState, extractState,
  numbersIn, factsCheck, specTexts, validateSpec, validatePost,
  offLimits, scopeCheck, publicMessage, nextRoundState, NEUTRAL_MESSAGE,
  beatDuration, clipFilter, photoFilter, uploadCopy, postText,
  pickProductFolder, socialHandles,
};
