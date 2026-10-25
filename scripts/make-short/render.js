/**
 * Turns a storyboard (spec) into the short: one video segment per beat (clip
 * or zooming photo with its caption), then the end card, as a 1080×1920
 * H.264 MP4. Text only — no voice, no music: the team adds a sound from the
 * TikTok/YouTube library when uploading. The audio track is silent so every
 * platform accepts the file and the in-app sound replaces it cleanly.
 * Writes short.mp4, cover.jpg and post.txt into `outDir`.
 */
const fs = require('fs');
const path = require('path');
const lib = require('./lib');
const media = require('./media');
const { renderOverlays } = require('./overlays');

const ENCODE = ['-an', '-r', String(lib.SIZE.fps), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p'];

/**
 * @param spec     storyboard (see lib.js)
 * @param files    media id → local file path, for every id the beats use
 */
async function renderShort({ spec, files, outDir, workDir }) {
  const business = lib.readBusiness();
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(workDir, { recursive: true });
  const w = (name) => path.join(workDir, name);

  // Each beat stays long enough to read its caption (or longer, if asked).
  const durations = [...spec.beats.map((b) => lib.beatDuration(b.caption, b.seconds)), lib.END_CARD_SECONDS];

  // 1. Captions and end card.
  const overlays = await renderOverlays(spec, business, workDir);

  // 2. One segment per beat.
  const segments = [];
  let photoCount = 0;
  for (const [i, beat] of spec.beats.entries()) {
    const seconds = durations[i];
    const source = files[beat.source];
    const seg = w(`seg-${i + 1}.mp4`);
    if (spec.media[beat.source].kind === 'video') {
      const info = media.probe(source);
      const start = Math.min(Math.max(0, beat.start || 0), Math.max(0, info.duration - 0.5));
      media.run('ffmpeg', ['-v', 'error', '-y', '-ss', String(start), '-t', String(seconds), '-i', source, '-i', overlays.captions[i],
        '-filter_complex', lib.clipFilter(info, seconds), '-map', '[v]', '-t', String(seconds), ...ENCODE, seg]);
    } else {
      const ready = await media.renderReadyPhoto(source, w(`photo-${i + 1}.jpg`));
      media.run('ffmpeg', ['-v', 'error', '-y', '-i', ready, '-i', overlays.captions[i],
        '-filter_complex', lib.photoFilter(seconds, photoCount++ % 2 === 0), '-map', '[v]', '-t', String(seconds), ...ENCODE, seg]);
    }
    segments.push(seg);
  }
  const endSeconds = durations[durations.length - 1];
  const endSeg = w('seg-end.mp4');
  media.run('ffmpeg', ['-v', 'error', '-y', '-loop', '1', '-t', String(endSeconds), '-i', overlays.end,
    '-vf', `fps=${lib.SIZE.fps},setsar=1,format=yuv420p`, '-t', String(endSeconds), ...ENCODE, endSeg]);
  segments.push(endSeg);

  // 3. Picture: hard cuts, as in the storyboard.
  const list = w('segments.txt');
  fs.writeFileSync(list, segments.map((s) => `file '${s.replace(/\\/g, '/')}'`).join('\n'));
  const picture = w('picture.mp4');
  media.run('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', picture]);

  // 4. Final file with a silent audio track, cover and post text.
  const total = durations.reduce((a, b) => a + b, 0);
  const video = path.join(outDir, 'short.mp4');
  media.run('ffmpeg', ['-v', 'error', '-y', '-i', picture, '-f', 'lavfi', '-t', String(total), '-i', 'anullsrc=r=44100:cl=stereo',
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '64k', '-shortest', '-movflags', '+faststart', video]);
  const cover = path.join(outDir, 'cover.jpg');
  media.run('ffmpeg', ['-v', 'error', '-y', '-ss', '1.0', '-i', video, '-frames:v', '1', '-q:v', '3', cover]);
  const post = path.join(outDir, 'post.txt');
  fs.writeFileSync(post, lib.postText(spec));

  return { video, cover, post, seconds: Math.round(total * 10) / 10 };
}

module.exports = { renderShort };
