import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IGX_CAROUSEL_DIRECTIVES, IGX_CARD_DIRECTIVES, IgxButtonDirective, IgxIconComponent } from 'igniteui-angular';

import { carouselImages } from './carousel-images';
import { SeoService } from '../services/seo.service';
import { HappyCustomersComponent } from '../shared/happy-customers/happy-customers.component';
import { YoutubeEmbedComponent } from '../shared/youtube-embed/youtube-embed.component';
import { FEATURED_VIDEO, videoObjectSchema } from '../shared/youtube-embed/video.util';
import { YOUTUBE_SUBSCRIBE_URL } from '../../data/site-links';

@Component({
  selector: 'app-main-page',
  imports: [IGX_CAROUSEL_DIRECTIVES, IGX_CARD_DIRECTIVES, IgxButtonDirective, IgxIconComponent, HappyCustomersComponent, YoutubeEmbedComponent],
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent {
  carouselImages = carouselImages;
  /** The promo video for the „Вижте ни в действие“ section (videos.json). */
  readonly featuredVideo = FEATURED_VIDEO;
  readonly youtubeSubscribeUrl = YOUTUBE_SUBSCRIBE_URL;

  constructor(private router: Router, private seoService: SeoService) {
    this.seoService.updateSeo({
      title: '3D печат и 3D принтиране по поръчка | Професионални услуги',
      description: 'Професионален 3D печат и 3D принтиране по поръчка. Изработка на прототипи, детайли и малки серии с високо качество и бързи срокове.',
      keywords: '3D печат, 3D принтиране, 3D печат по поръчка, 3D принтиране услуги, 3D прототипиране, 3D печат София',
      url: 'https://3dpechat.bg/',
      type: 'website'
    });
    // VideoObject for the promo video in the „Вижте ни в действие“ section.
    // setStructuredData replaces whatever per-page JSON-LD the previous route
    // left behind, so no removeStructuredData() call is needed first.
    this.seoService.setStructuredData({
      '@context': 'https://schema.org',
      ...videoObjectSchema(this.featuredVideo)
    });
  }

  navigateToPortfolio() {
    this.router.navigate(['/portfolio']);
  }

  navigateToContact() {
    this.router.navigate(['/contact']);
  }
}
