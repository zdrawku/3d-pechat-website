/**
 * Draws the caption overlays and the end card as 1080×1920 PNGs with
 * Playwright, using the approved design (word-pop captions, paper end card —
 * FEATURE-IDEAS-PLAN.md Idea 8). HTML gives us the outline stroke, the
 * orange key word and balanced line breaks that ffmpeg's drawtext can't.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const { ROOT, SIZE, socialHandles } = require('./lib');

const font = (file) => `data:font/woff2;base64,${fs.readFileSync(path.join(__dirname, 'fonts', file)).toString('base64')}`;
const FONT_CSS = `
@font-face { font-family: RC; font-weight: 100 900; src: url(${font('roboto-condensed-cyrillic.woff2')}) format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
@font-face { font-family: RC; font-weight: 100 900; src: url(${font('roboto-condensed-latin.woff2')}) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
html, body { margin: 0; width: ${SIZE.width}px; height: ${SIZE.height}px; background: transparent; }
`;

// Sizes are the storyboard's cqw values × 10.8 (1 % of 1080 px).
const CAPTION_CSS = `
.cap { position: absolute; left: 65px; right: 173px; top: 1037px; margin: 0; text-align: center;
  font: 800 99px/1.08 RC, sans-serif; color: #fff; letter-spacing: .01em; text-wrap: balance;
  -webkit-text-stroke: 17px #000; paint-order: stroke fill; }
.cap em { font-style: normal; color: #ff7043; }
/* Over a website recording the middle is where the action is: caption just
   below the platform's top bar, on a dark box so it reads over any page. */
.cap.top { top: 190px; right: auto; max-width: 842px; padding: 22px 30px 26px; border-radius: 28px;
  background: rgba(28, 23, 20, .82); -webkit-text-stroke: 0; font-size: 84px; text-align: left; }
`;

const END_CSS = `
body { background: #fbf7f3; }
.end { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 39px; padding: 108px 86px 281px; text-align: center; color: #1a1a1a; font-family: RC, sans-serif; box-sizing: border-box; }
.logo { width: 497px; border-radius: 97px; background: #fff; padding: 22px; box-sizing: border-box; }
.url { font-weight: 800; font-size: 108px; line-height: 1; color: #c13a0b; }
.line { font-weight: 600; font-size: 60px; line-height: 1.3; text-wrap: balance; }
.pill { font-weight: 700; font-size: 54px; background: #c13a0b; color: #fff; border-radius: 999px; padding: 24px 60px;
  text-transform: uppercase; letter-spacing: .04em; }
.handles { font-weight: 500; font-size: 48px; opacity: .75; }
`;

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Keeps a number on the same line as its unit („1 €“, „25 см“). */
const glue = (html) => html.replace(/(\d)\s+(?=[€%\p{L}])/gu, '$1 ');

/** The caption with its key word wrapped in <em>, everything escaped. */
function captionHtml(caption, highlight) {
  const i = highlight ? caption.indexOf(highlight) : -1;
  if (i === -1) return glue(escape(caption));
  return glue(`${escape(caption.slice(0, i))}<em>${escape(highlight)}</em>${escape(caption.slice(i + highlight.length))}`);
}

const page = (css, body) => `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}${css}</style></head><body>${body}</body></html>`;

/**
 * Writes cap-<n>.png for each beat and end.png into `dir`.
 * Returns { captions: [paths], end: path }.
 */
async function renderOverlays(spec, business, dir) {
  const logo = `data:image/png;base64,${fs.readFileSync(path.join(ROOT, 'src/assets/logo-512.png')).toString('base64')}`;
  const browser = await chromium.launch();
  try {
    const tab = await browser.newPage({ viewport: { width: SIZE.width, height: SIZE.height } });
    const shoot = async (html, file, transparent) => {
      await tab.setContent(html);
      await tab.evaluate(() => document.fonts.ready);
      await tab.screenshot({ path: file, omitBackground: transparent });
      return file;
    };

    const captions = [];
    for (const [i, beat] of spec.beats.entries()) {
      const html = page(CAPTION_CSS, `<p class="cap${beat.position === 'top' ? ' top' : ''}">${captionHtml(beat.caption, beat.highlight)}</p>`);
      captions.push(await shoot(html, path.join(dir, `cap-${i + 1}.png`), true));
    }

    const end = await shoot(page(END_CSS, `<div class="end">
      <img class="logo" src="${logo}" alt="">
      <span class="url">3dpechat.bg</span>
      <span class="line">${escape(spec.endCard.line)}</span>
      <span class="pill">Безплатна оферта</span>
      <span class="handles">${escape(socialHandles(business))}</span>
    </div>`), path.join(dir, 'end.png'), false);

    return { captions, end };
  } finally {
    await browser.close();
  }
}

module.exports = { renderOverlays, captionHtml };
