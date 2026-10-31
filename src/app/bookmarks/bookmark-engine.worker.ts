/// <reference lib="webworker" />
// The bookmark engine's Web Worker, bundled from this repo: Angular's builder doesn't bundle a worker that lives in node_modules.
import { serveBookmarkEngine } from '@printkit/bookmark-creator';

serveBookmarkEngine();
