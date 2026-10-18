import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IGX_CAROUSEL_DIRECTIVES, IGX_CARD_DIRECTIVES, IgxButtonDirective, IgxIconComponent } from 'igniteui-angular';

import { carouselImages } from './carousel-images';
import { SeoService } from '../services/seo.service';
import { HappyCustomersComponent } from '../shared/happy-customers/happy-customers.component';
import { YoutubeEmbedComponent } from '../shared/youtube-embed/youtube-embed.component';
import { FEATURED_VIDEO, videoObjectSchema } from '../shared/youtube-embed/video.util';
import { YOUTUBE_SUBSCRIBE_URL } from '../../data/site-links';
import { BUSINESS } from '../../data/business';
import { I18nService } from '../i18n/i18n.service';
import { LocalizePathPipe, TranslatePipe } from '../i18n/translate.pipe';
import { localizeVideo } from '../i18n/localized-content';
import type { TranslationKey } from '../i18n/i18n.types';
import homeMessages from '../../i18n/bg/home.json';

interface CardCopy {
  title: TranslationKey;
  text: TranslationKey;
}

@Component({
  selector: 'app-main-page',
  imports: [IGX_CAROUSEL_DIRECTIVES, IGX_CARD_DIRECTIVES, IgxButtonDirective, IgxIconComponent, HappyCustomersComponent, YoutubeEmbedComponent, RouterLink, TranslatePipe, LocalizePathPipe],
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent {
  private readonly i18n = inject(I18nService);

  carouselImages = carouselImages;
  /** The promo video for the „Вижте ни в действие“ section (videos.json), with its UI copy in the page's language. */
  readonly featuredVideo = computed(() => localizeVideo(FEATURED_VIDEO, this.i18n.content().videos[FEATURED_VIDEO.slug]));
  readonly youtubeSubscribeUrl = YOUTUBE_SUBSCRIBE_URL;
  /** „Отговор до 24ч“ — business.json, the same number as every other page. */
  readonly replyHours = BUSINESS.replyWithinHours;

  readonly props: readonly (CardCopy & { icon: string })[] = [
    { icon: '🎯', title: 'home.props.precision.title', text: 'home.props.precision.text' },
    { icon: '⚡', title: 'home.props.speed.title', text: 'home.props.speed.text' },
    { icon: '🧩', title: 'home.props.shape.title', text: 'home.props.shape.text' },
    { icon: '💬', title: 'home.props.support.title', text: 'home.props.support.text' }
  ];

  readonly steps: readonly CardCopy[] = [
    { title: 'home.process.idea.title', text: 'home.process.idea.text' },
    { title: 'home.process.quote.title', text: 'home.process.quote.text' },
    { title: 'home.process.print.title', text: 'home.process.print.text' },
    { title: 'home.process.delivery.title', text: 'home.process.delivery.text' }
  ];

  constructor(private seoService: SeoService) {
    // This page's Bulgarian strings live in its own chunk (src/i18n/bg/index.ts).
    this.i18n.registerPage('home', homeMessages);
    // Meta, canonical and the hreflang set for '/' ↔ '/en/' (src/i18n/<lang>/seo.json).
    this.seoService.applyPageSeo('home');
    // VideoObject for the promo video in the „Вижте ни в действие“ section —
    // the video's own (Bulgarian) title and description in every language.
    // setStructuredData replaces whatever per-page JSON-LD the previous route
    // left behind, so no removeStructuredData() call is needed first.
    this.seoService.setStructuredData({
      '@context': 'https://schema.org',
      ...videoObjectSchema(FEATURED_VIDEO)
    });
  }

}
