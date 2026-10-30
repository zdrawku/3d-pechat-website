/**
 * TEMPORARY — a stand-in for `@printkit/bookmark-creator` (W1).
 *
 * Fixed options, four fixed colours, a tiny order file, and a DEMO preview: a
 * flat SVG sketch of the request (size, shape outline, pictures and where they
 * were dragged to, colours, name, hole), so the page's wiring can be seen working. It is NOT how a bookmark
 * looks — no patterns, no 4-colour reduction, no relief — and nothing on the
 * page may depend on it. The real engine replaces all of this: delete this file
 * (and `engine.types.ts`) when the package is installed — see engine.token.ts.
 */
import { DEFAULT_FRAMING, pictureBox } from '../framing';
import type { BookmarkEngine, BookmarkPrint, BookmarkRequest, EngineOptions, Hex } from './engine.types';

/**
 * Outlines in a 40 × 100 box (the same ones draw the thumbnails and the demo
 * preview). `hole` is where, in that box's height, the hanging hole's centre goes at
 * the top and at the bottom — somewhere inside the outline, which differs per shape.
 */
const SHAPES: { id: string; label: string; d: string; hole: [top: number, bottom: number] }[] = [
  { id: 'rectangle', label: 'Rectangle', d: 'M6 4h28v92H6z', hole: [10, 90] },
  { id: 'rounded', label: 'Rounded', d: 'M6 16A12 12 0 0 1 18 4H22A12 12 0 0 1 34 16V84A12 12 0 0 1 22 96H18A12 12 0 0 1 6 84Z', hole: [11, 89] },
  { id: 'arch', label: 'Arch', d: 'M6 96V24a14 14 0 0 1 28 0v72z', hole: [20, 90] },
  { id: 'point', label: 'Pointed', d: 'M6 4h28v76l-14 16-14-16z', hole: [10, 72] },
  { id: 'tab', label: 'Tab', d: 'M6 12h8V4h12v8h8v84H6z', hole: [10, 90] },
  { id: 'wave', label: 'Wave', d: 'M6 4h28v84q-7 8-14 0t-14 0z', hole: [10, 78] },
  { id: 'tapered', label: 'Tapered', d: 'M10 4h20l4 92H6z', hole: [10, 90] },
  { id: 'notched', label: 'Notched', d: 'M6 4h28v92l-14-10L6 96z', hole: [10, 76] },
  { id: 'round-ends', label: 'Round ends', d: 'M6 18A14 14 0 0 1 34 18V82A14 14 0 0 1 6 82Z', hole: [13, 87] },
  { id: 'oval', label: 'Oval', d: 'M20 4A14 46 0 1 1 20 96A14 46 0 1 1 20 4Z', hole: [14, 86] }
];

const OPTIONS: EngineOptions = {
  shapes: SHAPES.map(({ id, label, d }) => ({
    id,
    label,
    thumbnailSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 100" aria-hidden="true"><path d="${d}" fill="currentColor"/></svg>`
  })),
  sizes: [
    { id: '40x160', label: '40 × 160 mm', widthMm: 40, heightMm: 160 },
    { id: '50x160', label: '50 × 160 mm', widthMm: 50, heightMm: 160 }
  ],
  patterns: [
    { id: 'isometric-cubes', label: 'Isometric cubes' },
    { id: 'waves', label: 'Waves' },
    { id: 'seigaiha', label: 'Seigaiha' }
  ],
  patternStyles: [
    { id: 'cut', label: 'Cut-through', colours: 2 },
    { id: 'relief', label: 'Raised', colours: 3 }
  ],
  set: { min: 1, max: 4, splitCounts: [2, 3, 4] },
  limits: { uploadMaxBytes: 10 * 1024 * 1024, uploadTypes: ['image/jpeg', 'image/png', 'image/webp'], nameMaxLength: 24, orderMaxBytes: 1024 * 1024 },
  expert: { nozzles: [0.4, 0.2], fonts: ['(from the engine)'], note: 'stub' }
};

export const STUB_COLOURS: Hex[] = ['#c13a0b', '#f0a46b', '#2c6fb5', '#222222'];

const SCALE = 3; // preview pixels per millimetre
const DEMO_PICTURE_PX = 480; // the demo draws a small copy of each picture, so a big upload stays cheap

const escapeXml = (text: string): string =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c] as string);

interface DemoPicture {
  url: string;
  aspect: number;
}

/** The picture, shrunk to a small JPEG data URL with its proportions (or null if the browser can't decode it). */
async function smallPicture(picture: Blob): Promise<DemoPicture | null> {
  try {
    const bitmap = await createImageBitmap(picture);
    const ratio = Math.min(1, DEMO_PICTURE_PX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return { url: canvas.toDataURL('image/jpeg', 0.8), aspect: canvas.width / canvas.height };
  } catch {
    return null;
  }
}

/** A flat sketch of the request: one bookmark, or a row of them for a set. */
async function demoPreview(req: BookmarkRequest, options: EngineOptions): Promise<string> {
  const size = options.sizes.find((s) => s.id === req.size) ?? options.sizes[0];
  const shape = SHAPES.find((s) => s.id === req.shape) ?? SHAPES[0];
  const outline = shape.d;
  const w = size.widthMm * SCALE;
  const h = size.heightMm * SCALE;
  const split = req.split ?? 1;
  const count = req.pictures?.length ?? (split > 1 ? split : req.names.length > 1 ? req.names.length : 1);
  const gap = 16;
  const colours = req.colours.length ? req.colours : STUB_COLOURS;
  const holeTop = (shape.hole[0] / 100) * h;
  const holeBottom = (shape.hole[1] / 100) * h;
  const holeY = req.hole === 'top' ? holeTop : holeBottom;
  const textY = { top: holeTop + 44, middle: h / 2, bottom: holeBottom - 38 }[req.namePlace];

  // One picture per bookmark, or one for all (a split, or a single bookmark).
  const blobs = req.mode === 'picture' ? (req.pictures ?? (req.picture ? [req.picture] : [])) : [];
  const pictures = await Promise.all(blobs.map(smallPicture));

  const bookmarks = Array.from({ length: count }, (_, i) => {
    const x = i * (w + gap);
    const name = req.names[i] ?? (req.names.length === 1 ? req.names[0] : '');
    const own = req.pictures ? i : 0;
    const picture = pictures[own];
    // A split picture covers the whole set's width; each bookmark shows its slice of it.
    const frameW = req.pictures ? w : w * split;
    const framing = req.framing?.[own] ?? DEFAULT_FRAMING;
    let image = '';
    if (picture) {
      const box = pictureBox(picture.aspect, frameW / h, framing);
      const boxW = (box.width / 100) * frameW;
      const boxH = (box.height / 100) * h;
      const sliceX = req.pictures ? 0 : i * w;
      image = `<image href="${picture.url}" x="${(box.left / 100) * frameW - sliceX}" y="${(box.top / 100) * h}" width="${boxW}" height="${boxH}" preserveAspectRatio="none"/>`;
    }
    const stripes = picture ? '' : colours.map((c, k) => `<rect x="${(w / colours.length) * k}" y="0" width="${w / colours.length + 1}" height="${h}" fill="${c}"/>`).join('');
    const label = req.mode === 'pattern' && req.pattern ? `<text x="${w / 2}" y="${h - 16}" text-anchor="middle" font-size="13" fill="#fff" opacity=".85" font-family="sans-serif">${escapeXml(req.pattern.id)} · ${req.pattern.style}</text>` : '';
    return `<g transform="translate(${x} 0)">
      <clipPath id="c${i}"><path d="${outline}" transform="scale(${w / 40} ${h / 100})"/></clipPath>
      <g clip-path="url(#c${i})"><rect width="${w}" height="${h}" fill="${colours[0]}"/>${stripes}${image}${label}</g>
      <path d="${outline}" transform="scale(${w / 40} ${h / 100})" fill="none" stroke="#00000055" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      ${req.hole === 'none' ? '' : `<circle cx="${w / 2}" cy="${holeY}" r="9" fill="#f8f5f1" stroke="#00000066" stroke-width="2"/>`}
      ${name ? `<text x="${w / 2}" y="${textY}" text-anchor="middle" font-size="24" font-weight="700" font-family="sans-serif" fill="#fff" stroke="#000" stroke-opacity=".55" stroke-width="5" paint-order="stroke">${escapeXml(name)}</text>` : ''}
    </g>`;
  }).join('');

  const total = count * w + (count - 1) * gap;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${h}" width="${total}" height="${h}">${bookmarks}</svg>`;
}

export function createBookmarkEngine(): Promise<BookmarkEngine> {
  return Promise.resolve({
    options: () => Promise.resolve(OPTIONS),
    suggestColours: () => Promise.resolve(STUB_COLOURS),
    preview: async (req) => ({ png: new Blob([await demoPreview(req, OPTIONS)], { type: 'image/svg+xml' }), warnings: [] }),
    createOrder: (_req, customer) => {
      const id = 'stub-order';
      const file = new Blob([JSON.stringify({ format: 'stub', id, customer })], { type: 'application/json' });
      return Promise.resolve({ id, fileName: `bookmark-order-${id}.json`, file, bytes: file.size, summary: `STUB ORDER ${id}\n${customer.name} <${customer.email}>` });
    },
    readOrder: () => Promise.reject(new Error('The bookmark engine is not installed yet.'))
  });
}

export function createBookmarkPrint(): Promise<BookmarkPrint> {
  return Promise.resolve({ build: () => Promise.reject(new Error('The bookmark engine is not installed yet.')) });
}
