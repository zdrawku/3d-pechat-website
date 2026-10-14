/**
 * A YouTube video as stored in `src/data/videos.json` (imported at build time,
 * like products and reviews — see `src/data/README.md`).
 *
 * The fields mirror what schema.org `VideoObject` needs, so one entry can feed
 * both the on-page player and its structured data without a lookup.
 */
export interface Video {
  /** YouTube video ID, e.g. `f8yTuEcOCjU` (the part after `youtu.be/`). */
  id: string;
  /** Stable kebab-case key for our own references (GA events, anchors). */
  slug: string;
  /** The one video the home page shows. Exactly one entry should set it. */
  featured?: boolean;
  /** Title as published on YouTube (Bulgarian). */
  title: string;
  /** One- or two-sentence Bulgarian summary. */
  description: string;
  /** ISO 8601 with offset, e.g. `2026-10-14T08:15:17+03:00`. */
  uploadDate: string;
  /** ISO 8601 duration, e.g. `PT1M1S`. */
  duration: string;
  /** Self-hosted poster, `assets/…` path (no leading slash), 16:9 webp. */
  poster: string;
  /** Alt text for the poster image. */
  posterAlt: string;
}

/** Shape of the whole `videos.json` file. */
export interface VideosData {
  videos: Video[];
}
