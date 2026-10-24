/**
 * Media I/O for the shorts pipeline: issue downloads, ffprobe, the preview
 * frames Claude looks at, and render-ready photos. Needs ffmpeg and ffprobe
 * on PATH.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const sharp = require('sharp');
const { SIZE, isAttachmentUrl } = require('./lib');

const MAX_BYTES = 500 * 1024 * 1024;
const EXT_BY_TYPE = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
  'image/heic': '.heic', 'image/heif': '.heic',
  'video/mp4': '.mp4', 'video/quicktime': '.mov', 'video/webm': '.webm',
};
const VIDEO_EXT = /\.(mp4|mov|m4v|webm|mkv)$/i;
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i;

const run = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }).toString();

function kindOf(file) {
  if (VIDEO_EXT.test(file)) return 'video';
  if (IMAGE_EXT.test(file)) return 'photo';
  return null;
}

/** Duration and on-screen size of a video, with phone rotation applied. */
function probe(file) {
  const info = JSON.parse(run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]));
  const v = info.streams.find((s) => s.codec_type === 'video') || {};
  const sideRotation = (v.side_data_list || []).find((d) => d.rotation !== undefined);
  const rotation = Math.abs(Number(sideRotation ? sideRotation.rotation : (v.tags && v.tags.rotate) || 0)) % 180;
  const [width, height] = rotation === 90 ? [v.height, v.width] : [v.width, v.height];
  return { duration: Number(info.format.duration) || 0, width, height };
}

/** Downloads one file dropped into an issue. Refuses anything not hosted by GitHub. */
async function downloadAttachment(url, dir, base) {
  if (!isAttachmentUrl(url)) throw new Error(`Not a GitHub attachment URL: ${url}`);
  const headers = { 'User-Agent': '3dpechat-make-short' };
  // Private-repo attachments need auth; public ones ignore the header.
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`);
  if (Number(res.headers.get('content-length') || 0) > MAX_BYTES) throw new Error(`${url} is larger than 500 MB`);
  const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const ext = EXT_BY_TYPE[type] || path.extname(new URL(res.url).pathname).toLowerCase();
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new Error(`${url} is larger than 500 MB`);
  const file = path.join(dir, `${base}${ext}`);
  fs.writeFileSync(file, buf);
  return file;
}

/** One frame per second for short clips; ten evenly spaced frames for long ones. */
function sampleTimes(duration) {
  const usable = Math.max(0.5, duration - 0.3);
  if (usable <= 10) return Array.from({ length: Math.max(1, Math.floor(usable)) }, (_, i) => i);
  return Array.from({ length: 10 }, (_, i) => Math.round(((i + 0.5) * usable) / 10 * 2) / 2);
}

/** Small JPEG frames of a clip, for Claude to choose segments from. */
function extractFrames(file, duration, outDir, id) {
  return sampleTimes(duration).map((t) => {
    const out = path.join(outDir, `${id}-${String(t).replace('.', '_')}s.jpg`);
    run('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', file, '-frames:v', '1', '-vf', 'scale=480:-2', '-q:v', '4', out]);
    return { t, file: out };
  });
}

/** Decodes any phone photo (HEIC through ffmpeg if sharp can't) to a sharp pipeline. */
async function openImage(file) {
  try {
    const img = sharp(file).rotate();
    await img.metadata();
    await img.clone().resize(8).toBuffer(); // forces a real decode
    return img;
  } catch {
    const tmp = `${file}.decoded.jpg`;
    run('ffmpeg', ['-v', 'error', '-y', '-i', file, '-frames:v', '1', tmp]);
    return sharp(tmp).rotate();
  }
}

/** A small JPEG of a photo for Claude. */
async function photoPreview(file, out) {
  const img = await openImage(file);
  await img.resize(640, 640, { fit: 'inside' }).jpeg({ quality: 78 }).toFile(out);
  return out;
}

/**
 * A photo at twice the output size, ready for the zoom. Upright photos fill
 * the frame; others sit on a blurred, darkened copy of themselves.
 */
async function renderReadyPhoto(file, out) {
  const W = SIZE.width * 2;
  const H = SIZE.height * 2;
  const img = await openImage(file);
  const { width, height } = await img.clone().toBuffer({ resolveWithObject: true }).then((r) => r.info);
  if (height / width >= 1.5) {
    await img.resize(W, H, { fit: 'cover', position: sharp.strategy.attention }).jpeg({ quality: 90 }).toFile(out);
    return out;
  }
  const bg = await img.clone().resize(W, H, { fit: 'cover' }).blur(60).modulate({ brightness: 0.85 }).toBuffer();
  const fg = await img.clone().resize(W, Math.round(H * 0.8), { fit: 'inside' }).toBuffer();
  await sharp(bg).composite([{ input: fg, gravity: 'center' }]).jpeg({ quality: 90 }).toFile(out);
  return out;
}

module.exports = {
  VIDEO_EXT, IMAGE_EXT, run, kindOf, probe, downloadAttachment,
  sampleTimes, extractFrames, photoPreview, renderReadyPhoto,
};
