/**
 * Pure helpers for the shorts pipeline (FEATURE-IDEAS-PLAN.md, Idea 8): issue
 * parsing, the storyboard ("spec") format, the facts check and the ffmpeg
 * filter strings. No network and no ffmpeg here, so all of it is unit-tested.
 *
 * A spec is the storyboard the agent writes (spec.json in the work folder):
 *   { product?, voice, media: { m1: {kind, origin, ref, name, duration?} },
 *     beats: [{ source, start, seconds?, position?, caption, highlight, voiceover }],
 *     endCard: { line, voiceover }, post: { title, description, hashtags } }
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

/** The voices a spec may name; null = music only. */
const VOICES = ['bg-BG-KalinaNeural', 'bg-BG-BorislavNeural', null];

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

/** Every text in a spec that ends up on screen, in the voice or in the upload copy. */
function specTexts(spec) {
  const post = spec.post || {};
  return [
    ...spec.beats.flatMap((b) => [b.caption, b.voiceover]),
    spec.endCard.line, spec.endCard.voiceover,
    post.tiktok && post.tiktok.caption,
    post.youtube && post.youtube.title,
    post.youtube && post.youtube.description,
    post.pinnedComment,
  ];
}

const HASHTAG = /^#[\p{L}\p{N}_]+$/u;

/**
 * The upload copy (spec.post) — what goes under the video on each platform:
 *   { link: "/products/",
 *     tiktok: { caption, hashtags: [] },              also used for Instagram Reels
 *     youtube: { title, description, tags: [] },
 *     pinnedComment }
 * Returns a list of problems, empty when fine.
 */
function validatePost(post) {
  if (!post || !post.tiktok || !post.youtube) return ['Липсва текстът за качване (post.tiktok и post.youtube).'];
  const problems = [];
  const { tiktok, youtube } = post;
  if (!/^\/([a-z0-9-]+\/)*$/.test(post.link || '')) problems.push('post.link е път от сайта, напр. "/products/" (с / накрая).');
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
  if (/https?:\/\//.test(description)) problems.push('YouTube: без линк в описанието — добавя се автоматично с проследяване.');
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
  if (!VOICES.includes(spec.voice === undefined ? null : spec.voice)) problems.push(`Непознат глас „${spec.voice}“ (${VOICES.filter(Boolean).join(', ')} или null).`);
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
    if ((b.voiceover || '').length > 160) problems.push(`Кадър ${n}: гласът е твърде дълъг.`);
    if (!spec.voice && b.voiceover) problems.push(`Кадър ${n}: има текст за глас, а гласът е изключен.`);
  });
  if (!spec.endCard || !spec.endCard.line || spec.endCard.line.length > 60) problems.push('Финалният кадър: редът трябва да е 1–60 знака.');
  return [...problems, ...validatePost(spec.post)];
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Seconds a beat stays on screen: long enough for its voice line and, for a
 * recorded flow, for the action the agent asked to show (`seconds`).
 */
function beatDuration(voiceSeconds, wanted) {
  const forVoice = voiceSeconds ? clamp(voiceSeconds + 0.45, 2.5, 7) : 3;
  return wanted ? clamp(Math.max(forVoice, wanted), 1.5, 8) : forVoice;
}
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

/**
 * The site link for a platform, tagged so GA4 shows which short brought the
 * visit (Acquisition → Traffic acquisition, session campaign).
 */
function trackedLink(post, source, campaign) {
  const params = new URLSearchParams({ utm_source: source, utm_medium: 'shorts', utm_campaign: campaign });
  return `https://3dpechat.bg${post.link}?${params}`;
}

/**
 * The copy to paste on each platform, finished: hashtags appended, the
 * tracked link and #shorts added to YouTube (its first three hashtags show
 * above the title).
 */
function uploadCopy(spec, campaign) {
  const { tiktok, youtube, pinnedComment } = spec.post;
  const hashtags = tiktok.hashtags.join(' ');
  return {
    tiktok: `${tiktok.caption.trim()}\n\n${hashtags}`,
    youtubeTitle: youtube.title.trim(),
    youtubeDescription: `${youtube.description.trim()}\n\n👉 ${trackedLink(spec.post, 'youtube', campaign)}\n\n${[...tiktok.hashtags.slice(0, 3), '#shorts'].join(' ')}`,
    youtubeTags: youtube.tags.join(', '),
    pinnedComment: pinnedComment.trim(),
    siteLink: trackedLink(spec.post, 'tiktok', campaign),
  };
}

/** post.txt: everything to paste when uploading, in the order you need it. */
function postText(spec, campaign) {
  const c = uploadCopy(spec, campaign);
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
    '=== Линк за TikTok био или сторис (с проследяване) ===',
    c.siteLink,
    '',
    'Съвет: отговаряй на коментарите през първия час — това е времето, в което платформите решават дали да покажат видеото на повече хора.',
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
  ROOT, SIZE, FORM, VOICES,
  readProducts, readBusiness,
  parseIssueForm, clean, isAttachmentUrl, extractAttachmentUrls, findProduct, parseShortIssue,
  STATE_MARKER, embedState, extractState,
  numbersIn, factsCheck, specTexts, validateSpec, validatePost,
  beatDuration, endCardDuration, clipFilter, photoFilter, trackedLink, uploadCopy, postText,
  pickProductFolder, socialHandles,
};
