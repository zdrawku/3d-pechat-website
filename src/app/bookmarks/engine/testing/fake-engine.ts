/**
 * The unit tests' stand-in for `@printkit/bookmark-creator`'s worker engine.
 *
 * The real engine needs a Web Worker and its previews take a second or more, so
 * Karma uses this instead; the e2e suite runs the real one. Its lists and limits
 * are the real `engineOptions()`, so the specs see real ids. Its preview is a
 * placeholder SVG with one `<clipPath>` per bookmark (so a spec can count them);
 * it is not how a bookmark looks.
 */
import { engineOptions } from '@printkit/bookmark-creator';

import type { BookmarkEngine, BookmarkPrint, BookmarkRequest, Hex } from '../engine.types';

export const FAKE_COLOURS: Hex[] = ['#c13a0b', '#f0a46b', '#2c6fb5', '#222222'];

/** How many bookmarks a request makes: one per picture, slice, pattern or name. */
function bookmarkCount(req: BookmarkRequest): number {
  const patterns = Array.isArray(req.pattern?.id) ? req.pattern.id.length : 1;
  return Math.max(req.pictures?.length ?? 1, req.split ?? 1, patterns, req.names.length);
}

function placeholder(req: BookmarkRequest): string {
  const clips = Array.from({ length: bookmarkCount(req) }, (_, i) => `<clipPath id="c${i}"><rect x="${i * 44}" width="40" height="160"/></clipPath>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${bookmarkCount(req) * 44} 160">${clips}</svg>`;
}

export function createBookmarkEngine(): Promise<BookmarkEngine> {
  const options = engineOptions();
  return Promise.resolve({
    options: () => Promise.resolve(options),
    suggestColours: () => Promise.resolve(FAKE_COLOURS),
    preview: (req) => Promise.resolve({
      png: new Blob([placeholder(req)], { type: 'image/svg+xml' }),
      warnings: [],
      quality: { stops: [{ value: options.quality.default, id: 'quality', swaps: 0, purgeGrams: 0, plan: 'fake' }], chosen: 0 }
    }),
    createOrder: (_req, customer) => {
      const id = 'fake-order';
      const file = new Blob([JSON.stringify({ format: 'fake', id, customer })], { type: 'application/json' });
      return Promise.resolve({ id, fileName: `bookmark-order-${id}.json`, file, bytes: file.size, summary: `FAKE ORDER ${id}\n${customer.name} <${customer.email}>` });
    },
    readOrder: () => Promise.reject(new Error('The fake engine reads no orders.'))
  });
}

export function createBookmarkPrint(): Promise<BookmarkPrint> {
  return Promise.resolve({ build: () => Promise.reject(new Error('The fake engine builds no print files.')) });
}
