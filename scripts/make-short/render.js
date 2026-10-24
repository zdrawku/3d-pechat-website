/**
 * Turns an approved storyboard (spec) into the short: one video segment per
 * beat (clip or zooming photo with its caption), the end card, the Bulgarian
 * voice from edge-tts and optional music, muxed to a 1080×1920 H.264 MP4.
 * Writes short.mp4, cover.jpg and post.txt into `outDir`.
 */
const fs = require('fs');
const path = require('path');
const lib = require('./lib');
const media = require('./media');
const { renderOverlays } = require('./overlays');

const PYTHON = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const ENCODE = ['-an', '-r', String(lib.SIZE.fps), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p'];

/** Speaks one line with edge-tts. Returns its length in seconds (0 for no line). */
function speak(text, voice, out) {
  if (!voice || !text || !text.trim()) return 0;
  try {
    // `--text=` keeps a line that starts with "-" from being read as an option.
    media.run(PYTHON, ['-m', 'edge_tts', '--voice', voice, `--text=${text}`, '--write-media', out]);
  } catch (err) {
    throw new Error(`edge-tts failed (Microsoft's free voice service may have changed — try a newer edge-tts): ${err.stderr || err.message}`);
  }
  return media.audioDuration(out);
}

/**
 * @param spec    approved storyboard (see lib.js)
 * @param files   media id → local file path, for every id the beats use
 * @param music   optional music file
 * @param campaign utm_campaign for the links in post.txt
 */
async function renderShort({ spec, files, outDir, workDir, music, campaign = 'short' }) {
  const business = lib.readBusiness();
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(workDir, { recursive: true });
  const w = (name) => path.join(workDir, name);

  // 1. Voice, one file per beat, so each beat lasts as long as its line.
  const lines = [...spec.beats.map((b) => b.voiceover), spec.endCard.voiceover];
  const voice = lines.map((text, i) => {
    const file = w(`voice-${i + 1}.mp3`);
    return { file, seconds: speak(text, spec.voice, file) };
  });
  const durations = [
    ...spec.beats.map((b, i) => lib.beatDuration(voice[i].seconds, b.seconds)),
    lib.endCardDuration(voice[spec.beats.length].seconds),
  ];

  // 2. Captions and end card.
  const overlays = await renderOverlays(spec, business, workDir);

  // 3. One segment per beat.
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

  // 4. Picture: hard cuts, as in the storyboard.
  const list = w('segments.txt');
  fs.writeFileSync(list, segments.map((s) => `file '${s.replace(/\\/g, '/')}'`).join('\n'));
  const picture = w('picture.mp4');
  media.run('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', picture]);

  // 5. Sound: each voice line padded to its beat, music under it.
  const total = durations.reduce((a, b) => a + b, 0);
  const inputs = [];
  const chains = [];
  voice.forEach((v, i) => {
    if (v.seconds) {
      inputs.push('-i', v.file);
      // atrim: a line longer than the 7 s beat cap is cut rather than drifting into the next beat.
      chains.push(`[${inputs.length / 2 - 1}:a]aformat=sample_rates=44100:channel_layouts=stereo,apad=whole_dur=${durations[i]},atrim=duration=${durations[i]}[s${i}]`);
    } else {
      chains.push(`anullsrc=r=44100:cl=stereo,atrim=duration=${durations[i]}[s${i}]`);
    }
  });
  chains.push(`${voice.map((_, i) => `[s${i}]`).join('')}concat=n=${voice.length}:v=0:a=1[voice]`);
  let out = '[voice]';
  if (music) {
    inputs.push('-stream_loop', '-1', '-i', music);
    const m = inputs.filter((x) => x === '-i').length - 1;
    const level = voice.some((v) => v.seconds) ? 0.16 : 0.7;
    chains.push(`[${m}:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=${level},atrim=duration=${total},afade=t=out:st=${Math.max(0, total - 1.2)}:d=1.2[music]`);
    chains.push('[voice][music]amix=inputs=2:duration=first:normalize=0[mix]');
    out = '[mix]';
  }
  const sound = w('sound.m4a');
  media.run('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', chains.join(';'), '-map', out, '-t', String(total), '-c:a', 'aac', '-b:a', '160k', sound]);

  // 6. Final file, cover and post text.
  const video = path.join(outDir, 'short.mp4');
  media.run('ffmpeg', ['-v', 'error', '-y', '-i', picture, '-i', sound, '-map', '0:v', '-map', '1:a', '-c', 'copy', '-shortest', '-movflags', '+faststart', video]);
  const cover = path.join(outDir, 'cover.jpg');
  media.run('ffmpeg', ['-v', 'error', '-y', '-ss', '1.0', '-i', video, '-frames:v', '1', '-q:v', '3', cover]);
  const post = path.join(outDir, 'post.txt');
  fs.writeFileSync(post, lib.postText(spec, campaign));

  return { video, cover, post, seconds: Math.round(total * 10) / 10 };
}

module.exports = { renderShort, speak };
