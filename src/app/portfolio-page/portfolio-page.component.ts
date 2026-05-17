import { Component } from '@angular/core';
import { IGX_CAROUSEL_DIRECTIVES } from 'igniteui-angular';

import { carouselImages } from './carousel-images';
import { SeoService } from '../services/seo.service';

@Component({
  selector: 'app-portfolio-page',
  imports: [IGX_CAROUSEL_DIRECTIVES],
  templateUrl: './portfolio-page.component.html',
  styleUrls: ['./portfolio-page.component.scss']
})
export class PortfolioPageComponent {
  carouselImages = carouselImages;

  constructor(private seoService: SeoService) {
    this.seoService.updateSeo({
      title: 'Портфолио - 3D Печат България',
      description: 'Разгледайте нашето портфолио от 3D принтирани проекти. Прототипи, детайли, макети и персонализирани продукти с високо качество.',
      keywords: '3D печат портфолио, 3D принтирани проекти, прототипи, макети, 3D печат примери',
      url: 'https://3dpechat.bg/portfolio',
      type: 'website'
    });
    this.seoService.removeStructuredData();
  }
}
