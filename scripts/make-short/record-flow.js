/**
 * Records a website user flow on a phone-sized screen for a short, e.g.
 * „как да поръчаш в 3 стъпки“. The flow is a small JSON script the agent
 * writes (no code), so a recording can only do what these steps allow:
 *
 *   { "baseUrl": "https://3dpechat.bg",
 *     "steps": [
 *       { "goto": "/products/" },
 *       { "mark": "step1" },                         // a timestamp for the storyboard
 *       { "scroll": 600 },                           // pixels
 *       { "scrollTo": { "text": "Държач за евро монети" } },
 *       { "tap": { "selector": "[data-testid=product-order-btn]",
 *                  "within": { "selector": "igx-card", "text": "Държач за евро монети" } } },
 *       { "type": { "placeholder": "Вашето име", "text": "Мария" } },
 *       { "wait": 1500 } ] }
 *
 * A target is one of { selector } | { text } | { role, name } | { placeholder },
 * optionally `nth` and `within`. Taps show a marker where the finger lands.
 *
 * How it films: Chrome's live screencast only delivers CSS-pixel frames
 * (360×640), so instead every scroll step, tap-marker step and keystroke is
 * a full 1080×1920 screenshot held for 1/30 s on a synthetic timeline. The
 * result is smooth 30 fps whatever the speed of the machine.
 *
 * Safety: consent is pre-answered „denied“ (no banner, no analytics), the
 * review snackbar is pre-dismissed, analytics and the contact form's endpoint
 * are blocked, so a recording never sends an enquiry or counts as a visit.
 * Only 3dpechat.bg or a localhost build can be recorded.
 *
 * Output: <name>.mp4 (1080×1920, 30 fps) and <name>.marks.json ({ mark: seconds }).
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const media = require('./media');

const VIEWPORT = { width: 360, height: 640 }; // × 3 = 1080 × 1920, exactly 9:16
const SCALE = 3;
const FRAME = 1 / 30;
const BLOCKED = [/google-analytics\.com/, /analytics\.google\.com/, /googletagmanager\.com/, /doubleclick\.net/, /api\.web3forms\.com/, /hcaptcha\.com/];
const ALLOWED_HOSTS = /^(3dpechat\.bg|www\.3dpechat\.bg|localhost|127\.0\.0\.1)$/;
const KINDS = ['goto', 'mark', 'scroll', 'scrollTo', 'tap', 'type', 'wait'];

// Runs before the site's own scripts on every page.
const INIT_SCRIPT = `
try {
  localStorage.setItem('consent', JSON.stringify({ analytics: 'denied', at: Date.now() }));
  localStorage.setItem('reviewCtaDismissedAt', String(Date.now()));
} catch (e) {}
window.__tapDot = (x, y, scale, opacity) => {
  let d = document.getElementById('__tapdot');
  if (!d) {
    d = document.createElement('div');
    d.id = '__tapdot';
    d.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;width:44px;height:44px;margin:-22px 0 0 -22px;'
      + 'border-radius:50%;background:rgba(255,112,67,.35);border:3px solid #c13a0b;';
    document.documentElement.appendChild(d);
  }
  d.style.left = x + 'px'; d.style.top = y + 'px';
  d.style.transform = 'scale(' + scale + ')'; d.style.opacity = String(opacity);
};`;

function validateFlow(flow) {
  const problems = [];
  let base;
  try {
    base = new URL(flow.baseUrl || 'https://3dpechat.bg');
  } catch {
    return ['baseUrl is not a URL'];
  }
  if (!ALLOWED_HOSTS.test(base.hostname)) problems.push(`Only 3dpechat.bg or localhost can be recorded, not ${base.hostname}`);
  if (!Array.isArray(flow.steps) || !flow.steps.length) problems.push('steps must be a non-empty array');
  (flow.steps || []).forEach((s, i) => {
    const keys = Object.keys(s || {});
    if (keys.length !== 1 || !KINDS.includes(keys[0])) problems.push(`step ${i + 1}: use exactly one of ${KINDS.join(', ')}`);
    else if (s.goto !== undefined && !String(s.goto).startsWith('/')) problems.push(`step ${i + 1}: goto takes a path starting with /`);
    else if (s.type && typeof s.type.text !== 'string') problems.push(`step ${i + 1}: type needs "text"`);
  });
  if ((flow.steps || []).filter((s) => s && s.goto !== undefined).length === 0) problems.push('the first page needs a goto step');
  return problems;
}

function locate(page, target) {
  let scope = page;
  if (target.within) {
    scope = page.locator(target.within.selector || '*', target.within.text ? { hasText: target.within.text } : {}).first();
  }
  let loc;
  if (target.selector) loc = scope.locator(target.selector);
  else if (target.role) loc = scope.getByRole(target.role, target.name ? { name: target.name } : {});
  else if (target.placeholder) loc = scope.getByPlaceholder(target.placeholder);
  else if (target.text) loc = scope.getByText(target.text, { exact: false });
  else throw new Error(`Target needs selector, role, placeholder or text: ${JSON.stringify(target)}`);
  return loc.nth(target.nth || 0);
}

/** The frames so far and how long each is shown. */
class Tape {
  constructor(page, dir) {
    this.page = page;
    this.dir = dir;
    this.entries = [];
    this.t = 0;
  }

  async snap(seconds = FRAME) {
    const file = path.join(this.dir, `${String(this.entries.length).padStart(5, '0')}.jpg`);
    await this.page.screenshot({ path: file, type: 'jpeg', quality: 90 });
    this.entries.push({ file, seconds });
    this.t += seconds;
  }

  hold(seconds) {
    if (!this.entries.length || seconds <= 0) return;
    this.entries[this.entries.length - 1].seconds += seconds;
    this.t += seconds;
  }
}

const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);

/** Scrolls to `targetY` over several frames (ease in-out). */
async function smoothScroll(tape, targetY) {
  const from = await tape.page.evaluate(() => window.scrollY);
  const to = await tape.page.evaluate((y) => Math.max(0, Math.min(y, document.documentElement.scrollHeight - window.innerHeight)), targetY);
  const distance = to - from;
  if (Math.abs(distance) < 2) return;
  const steps = Math.min(45, Math.max(12, Math.round(Math.abs(distance) / 22)));
  for (let i = 1; i <= steps; i++) {
    await tape.page.evaluate((y) => window.scrollTo(0, y), from + distance * ease(i / steps));
    await tape.snap();
  }
  await tape.page.waitForTimeout(150);
  await tape.snap(0.25);
}

/** Brings an element to ~40 % of the screen height. */
async function scrollToTarget(tape, loc) {
  await loc.waitFor({ state: 'attached', timeout: 15000 });
  const y = await loc.evaluate((el) => window.scrollY + el.getBoundingClientRect().top - window.innerHeight * 0.4);
  await smoothScroll(tape, y);
}

/** The orange marker grows and fades where the finger lands. */
async function tapMarker(tape, loc) {
  const box = await loc.boundingBox();
  if (!box) return;
  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
  for (let i = 0; i <= 9; i++) {
    await tape.page.evaluate(([px, py, s, o]) => window.__tapDot(px, py, s, o), [x, y, 0.6 + 0.08 * i, i < 5 ? 1 : 1 - (i - 4) / 5]);
    await tape.snap();
  }
  await tape.page.evaluate(() => window.__tapDot(0, 0, 0, 0));
}

/**
 * @returns { video, marks, seconds }
 */
async function recordFlow(flow, outDir, name = 'flow') {
  const problems = validateFlow(flow);
  if (problems.length) throw new Error(`Bad flow:\n${problems.join('\n')}`);
  const framesDir = path.join(outDir, `${name}-frames`);
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });
  const base = (flow.baseUrl || 'https://3dpechat.bg').replace(/\/$/, '');

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT, deviceScaleFactor: SCALE, isMobile: true, hasTouch: true,
    locale: 'bg-BG', colorScheme: flow.dark ? 'dark' : 'light',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',
  });
  await context.route('**/*', (route) => (BLOCKED.some((re) => re.test(route.request().url())) ? route.abort() : route.continue()));
  await context.addInitScript(INIT_SCRIPT);

  const page = await context.newPage();
  const tape = new Tape(page, framesDir);
  const marks = {};

  try {
    for (const step of flow.steps) {
      if (step.goto !== undefined) {
        await page.goto(base + step.goto, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);
        await tape.snap(0.6);
      } else if (step.mark !== undefined) {
        marks[step.mark] = Math.round(tape.t * 10) / 10;
      } else if (step.scroll !== undefined) {
        await smoothScroll(tape, (await page.evaluate(() => window.scrollY)) + Number(step.scroll));
      } else if (step.scrollTo) {
        await scrollToTarget(tape, locate(page, step.scrollTo));
      } else if (step.tap) {
        const loc = locate(page, step.tap);
        await scrollToTarget(tape, loc);
        await tapMarker(tape, loc);
        await loc.click();
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(600);
        await tape.snap(0.4);
      } else if (step.type) {
        const loc = locate(page, step.type);
        await scrollToTarget(tape, loc);
        await tapMarker(tape, loc);
        await loc.click();
        for (const ch of String(step.type.text)) {
          await page.keyboard.type(ch);
          await tape.snap(FRAME * 2);
        }
        await tape.snap(0.3);
      } else if (step.wait !== undefined) {
        const ms = Math.min(Number(step.wait), 10000);
        await page.waitForTimeout(Math.min(ms, 1500)); // let anything that moves settle
        await tape.snap(Math.max(FRAME, ms / 1000));
      }
    }
    marks.end = Math.round(tape.t * 10) / 10;
  } finally {
    await browser.close();
  }

  // Images with per-frame durations → 30 fps H.264.
  const list = path.join(framesDir, 'frames.txt');
  const lines = tape.entries.flatMap((e) => [`file '${e.file.replace(/\\/g, '/')}'`, `duration ${e.seconds.toFixed(4)}`]);
  lines.push(`file '${tape.entries[tape.entries.length - 1].file.replace(/\\/g, '/')}'`);
  fs.writeFileSync(list, lines.join('\n'));
  const video = path.join(outDir, `${name}.mp4`);
  // -t: the concat demuxer holds the last image longer than its duration.
  media.run('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list,
    '-vf', 'fps=30,scale=1080:1920,format=yuv420p', '-t', tape.t.toFixed(3), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-an', video]);
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.writeFileSync(path.join(outDir, `${name}.marks.json`), JSON.stringify(marks, null, 2));
  return { video, marks, seconds: Math.round(tape.t * 10) / 10 };
}

module.exports = { recordFlow, validateFlow, VIEWPORT, SCALE };
