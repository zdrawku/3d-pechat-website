import { InjectionToken } from '@angular/core';

import type { BookmarkEngine, BookmarkPrint } from './engine.types';

/**
 * Starts the bookmark engine. Only ever called in the browser (the engine
 * never runs during prerender), and lazily, so customers' other pages don't
 * carry it. W2: point this at `import('@printkit/bookmark-creator')` and
 * delete ./stub-engine.ts — nothing else in the app changes.
 */
export const BOOKMARK_ENGINE = new InjectionToken<() => Promise<BookmarkEngine>>('BOOKMARK_ENGINE', {
  providedIn: 'root',
  factory: () => () => import('./stub-engine').then((m) => m.createBookmarkEngine())
});

/**
 * Print-file building (3MF / STL / zip), admin only. Loaded after unlocking,
 * never for customers: the real one contains WebAssembly.
 */
export const BOOKMARK_PRINT = new InjectionToken<() => Promise<BookmarkPrint>>('BOOKMARK_PRINT', {
  providedIn: 'root',
  factory: () => () => import('./stub-engine').then((m) => m.createBookmarkPrint())
});
