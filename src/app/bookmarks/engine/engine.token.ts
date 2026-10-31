import { InjectionToken } from '@angular/core';

import type { BookmarkEngine, BookmarkPrint } from './engine.types';

/**
 * Starts the bookmark engine (`@printkit/bookmark-creator`) in its Web Worker.
 * Only ever called in the browser (the engine never runs during prerender),
 * and lazily, so customers' other pages don't carry it. The worker is
 * ../bookmark-engine.worker.ts: Angular's builder bundles a worker only from
 * this repo's sources, not from node_modules.
 */
export const BOOKMARK_ENGINE = new InjectionToken<() => Promise<BookmarkEngine>>('BOOKMARK_ENGINE', {
  providedIn: 'root',
  factory: () => () =>
    import('@printkit/bookmark-creator').then((m) =>
      m.createBookmarkEngine({
        worker: new Worker(new URL('../bookmark-engine.worker', import.meta.url), { type: 'module', name: 'bookmark-engine' })
      }))
});

/**
 * Print-file building (3MF / STL / zip), admin only. Loaded after unlocking,
 * never for customers: it contains WebAssembly (`manifold.wasm`, copied to
 * assets/bookmarks/ by angular.json from the package's own vendor folder).
 */
export const BOOKMARK_PRINT = new InjectionToken<() => Promise<BookmarkPrint>>('BOOKMARK_PRINT', {
  providedIn: 'root',
  factory: () => () =>
    import('@printkit/bookmark-creator/print').then((m) =>
      m.createBookmarkPrint({ wasmUrl: new URL('assets/bookmarks/manifold.wasm', document.baseURI).href }))
});
