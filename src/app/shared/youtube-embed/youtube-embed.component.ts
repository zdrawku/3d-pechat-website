import { Component, Input, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IGX_CARD_DIRECTIVES, IgxIconButtonDirective, IgxIconComponent } from 'igniteui-angular';

import { Video } from '../../models/video.model';
import { formatDuration, youtubeEmbedUrl } from './video.util';

/** GA4 global from index.html; absent during prerender and in unit tests. */
declare const gtag: ((...args: unknown[]) => void) | undefined;

/**
 * Click-to-play YouTube player (approved design „A“, Idea 7).
 *
 * Until the visitor presses play it renders only our self-hosted poster, so a
 * page with a video makes **no** request to YouTube on load: no scripts, no
 * cookies, no effect on LCP. The privacy-enhanced iframe is created on the
 * click, already playing. The 16:9 box is fixed, so nothing shifts.
 *
 * Built from Ignite UI: `igx-card` + `igx-card-media`, an `igxIconButton`
 * play button and `igx-icon` (asserted in the spec).
 */
@Component({
  selector: 'app-youtube-embed',
  imports: [IGX_CARD_DIRECTIVES, IgxIconButtonDirective, IgxIconComponent],
  templateUrl: './youtube-embed.component.html',
  styleUrls: ['./youtube-embed.component.scss']
})
export class YoutubeEmbedComponent {
  /** Entry from `src/data/videos.json`. */
  @Input({ required: true }) video!: Video;

  /** True once the visitor pressed play and the iframe replaced the poster. */
  public playing = false;
  public embedSrc: SafeResourceUrl | null = null;

  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);

  public get durationLabel(): string {
    return formatDuration(this.video.duration);
  }

  public play(): void {
    if (this.playing || !isPlatformBrowser(this.platformId)) {
      return;
    }
    // Trusted: the URL is built from our own videos.json id and a fixed host.
    this.embedSrc = this.sanitizer.bypassSecurityTrustResourceUrl(youtubeEmbedUrl(this.video.id, true));
    this.playing = true;

    if (typeof gtag === 'function') {
      gtag('event', 'video_start', {
        video_provider: 'youtube',
        video_id: this.video.id,
        video_title: this.video.title
      });
    }
  }
}
