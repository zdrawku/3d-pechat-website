import { Video, VideosData } from '../../models/video.model';
import videosData from '../../../data/videos.json';

/**
 * Privacy-enhanced embed host. It is the ONLY YouTube host allowed by the CSP
 * `frame-src` in src/index.html / src/404.html — embedding www.youtube.com
 * instead would be blocked silently.
 */
export const YOUTUBE_EMBED_HOST = 'https://www.youtube-nocookie.com';

const SITE_ORIGIN = 'https://3dpechat.bg';

/** All curated videos, in file order (imported at build time, Rule 4). */
export const VIDEOS: readonly Video[] = (videosData as VideosData).videos;

/** The video the home page shows (`featured: true` in videos.json). */
export const FEATURED_VIDEO: Video = VIDEOS.find((v) => v.featured) ?? VIDEOS[0];

/** `https://www.youtube.com/watch?v=<id>` — the canonical public page. */
export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

/**
 * Embed URL for the click-to-play iframe. `autoplay=1` is fine here: the
 * iframe only exists after the visitor pressed play. `rel=0` limits the
 * end-screen suggestions to our own channel.
 */
export function youtubeEmbedUrl(id: string, autoplay = false): string {
  const params = new URLSearchParams({ rel: '0', playsinline: '1' });
  if (autoplay) {
    params.set('autoplay', '1');
  }
  return `${YOUTUBE_EMBED_HOST}/embed/${id}?${params.toString()}`;
}

/** ISO 8601 duration (`PT1M1S`) to a player label (`1:01`, or `1:02:03`). */
export function formatDuration(iso: string): string {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) {
    return '';
  }
  const [h, min, s] = [m[1], m[2], m[3]].map((n) => Number(n ?? 0));
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${String(min).padStart(2, '0')}:${ss}` : `${min}:${ss}`;
}

/**
 * schema.org `VideoObject` for a video, without `@context` so it can sit in an
 * `@graph` or be spread into a standalone block. `publisher` points at the
 * site-wide Organization (`#organization` in index.html) instead of repeating it.
 */
export function videoObjectSchema(video: Video): Record<string, unknown> {
  return {
    '@type': 'VideoObject',
    '@id': `${SITE_ORIGIN}/#video-${video.slug}`,
    name: video.title,
    description: video.description,
    thumbnailUrl: [
      `${SITE_ORIGIN}/${video.poster}`,
      `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`
    ],
    uploadDate: video.uploadDate,
    duration: video.duration,
    contentUrl: youtubeWatchUrl(video.id),
    embedUrl: youtubeEmbedUrl(video.id),
    inLanguage: 'bg',
    publisher: { '@id': `${SITE_ORIGIN}/#organization` }
  };
}
