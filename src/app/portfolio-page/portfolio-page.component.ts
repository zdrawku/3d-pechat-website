import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IgxButtonDirective, IgxIconComponent } from 'igniteui-angular';

import { carouselImages } from './carousel-images';
import { SeoService } from '../services/seo.service';
import { LocalizePathPipe, TranslatePipe } from '../i18n/translate.pipe';
import { I18nService } from '../i18n/i18n.service';
import portfolioMessages from '../../i18n/bg/portfolio.json';

@Component({
  selector: 'app-portfolio-page',
  imports: [RouterLink, IgxButtonDirective, IgxIconComponent, TranslatePipe, LocalizePathPipe],
  templateUrl: './portfolio-page.component.html',
  styleUrls: ['./portfolio-page.component.scss']
})
export class PortfolioPageComponent {
  carouselImages = carouselImages;

  /** „Играчки за ръчно рисуване“ photos, in display order. */
  readonly toyImages = [
    '/assets/real-images/20251227_201101.webp',
    '/assets/real-images/20250109_183236.webp',
    '/assets/real-images/20251218_180815.webp',
    '/assets/real-images/20250113_203642.webp',
    '/assets/real-images/20251213_122205.webp',
    '/assets/real-images/20251213_195315.webp',
    '/assets/real-images/20251218_091205.webp'
  ];

  constructor(private seoService: SeoService) {
    // This page's Bulgarian strings live in its own chunk (src/i18n/bg/index.ts).
    inject(I18nService).registerPage('portfolio', portfolioMessages);
    this.seoService.applyPageSeo('portfolio');
    this.seoService.removeStructuredData();
  }
}
