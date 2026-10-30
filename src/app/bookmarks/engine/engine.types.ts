/**
 * The bookmark engine's contract (draft v0) — what the page codes against.
 *
 * The real engine is `@printkit/bookmark-creator`, written in its own repo and
 * not published yet. Until it is, `stub-engine.ts` stands in behind
 * `BOOKMARK_ENGINE`. When the package ships, its published types replace this
 * file and the stub is deleted: they are authoritative, names here may change.
 *
 * The site holds NO bookmark logic: colours, previews, name placement, shapes,
 * patterns, order files and print files all come from the engine. The site only
 * collects choices, shows what comes back and sends the order.
 */

export type Hex = `#${string}`;
export type Place = 'top' | 'middle' | 'bottom';
export type Hole = 'top' | 'bottom' | 'none';
export type PatternStyleId = 'cut' | 'relief';

/** A span in millimetres. */
export interface Range {
  min: number;
  max: number;
  step: number;
}

export interface EngineOptions {
  shapes: { id: string; label: string; thumbnailSvg: string }[];
  sizes: { id: string; label: string; widthMm: number; heightMm: number }[];
  /**
   * Any width × height in mm within these ranges: a request's `size` is then `'<w>x<h>'`
   * (the same string form as a preset id). Absent = presets only.
   * PROPOSED EXTENSION (BOOKMARKS-ENGINE-CONTRACT.md §1.9) — the page doesn't offer it yet.
   */
  customSize?: { widthMm: Range; heightMm: Range };
  /** How many colours a picture uses. Absent = 4. PROPOSED EXTENSION (§1.4). */
  pictureColours?: number;
  patterns: { id: string; label: string }[];
  patternStyles: { id: PatternStyleId; label: string; colours: number }[];
  set: { min: number; max: number; splitCounts: number[] };
  limits: { uploadMaxBytes: number; uploadTypes: string[]; nameMaxLength: number; orderMaxBytes: number };
  /** Admin-only option descriptions (shape still open). */
  expert: unknown;
}

/**
 * Where a picture sits in its bookmark (or, for a split, in the whole set):
 * `x` and `y` (0–1) are CSS `background-position` fractions, and `zoom` (≥ 1)
 * scales the picture beyond `background-size: cover`. The default is centred,
 * zoom 1. The page only collects these by dragging; the engine applies them.
 * PROPOSED EXTENSION of the draft contract — to be passed on to the package author.
 */
export interface Framing {
  x: number;
  y: number;
  zoom: number;
}

export interface BookmarkRequest {
  mode: 'picture' | 'pattern';
  /** Mode 'picture': one picture for the bookmark, or split across a set (`split`). */
  picture?: Blob;
  /**
   * Mode 'picture', a set of different pictures: one per bookmark (so the set
   * has `pictures.length` bookmarks). Instead of `picture`/`split`.
   * PROPOSED EXTENSION of the draft contract.
   */
  pictures?: Blob[];
  /** One entry per picture (`picture` → 1, `pictures` → one each). Missing = centred. PROPOSED EXTENSION. */
  framing?: Framing[];
  /** Mode 'pattern'. */
  pattern?: { id: string; style: PatternStyleId };
  shape: string;
  size: string;
  /** Base first, 1–4. */
  colours: Hex[];
  /** With `pictures`: a palette for each picture (missing = `colours`). PROPOSED EXTENSION (§1.3) — not sent yet. */
  pictureColours?: Hex[][];
  hole: Hole;
  /** [] = no name; 2–5 = a set, one bookmark per name. */
  names: string[];
  namePlace: Place;
  /** One picture split across N bookmarks (a triptych = 3). */
  split?: number;
  /** Admin only. */
  expert?: Record<string, unknown>;
}

export interface Customer {
  name: string;
  email: string;
  phone: string;
  quantity: number;
  notes: string;
  locale: string;
}

export interface PreviewWarning {
  /** Stable — the site translates by code and falls back to `message`. */
  code: string;
  message: string;
}

export interface CreatedOrder {
  id: string;
  fileName: string;
  file: Blob;
  bytes: number;
  /** Plain text for the email body: what was ordered, colours, names, quantity, contact, order id. */
  summary: string;
}

export interface BookmarkEngine {
  options(): Promise<EngineOptions>;
  suggestColours(picture: Blob, count?: number): Promise<Hex[]>;
  preview(req: BookmarkRequest): Promise<{ png: Blob; warnings: PreviewWarning[] }>;
  createOrder(req: BookmarkRequest, customer: Customer, opts?: { container?: 'json' | 'zip' }): Promise<CreatedOrder>;
  /** Admin. */
  readOrder(file: Blob): Promise<{ customer: Customer; request: BookmarkRequest; id: string }>;
}

/** `@printkit/bookmark-creator/print` — admin only, lazy-loaded after unlocking (it carries WebAssembly). */
export interface BookmarkPrint {
  build(req: BookmarkRequest, opts?: { nozzle?: 0.4 | 0.2 }): Promise<{ threeMf: Blob; stls: { name: string; file: Blob }[]; zip: Blob }>;
}
