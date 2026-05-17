import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IGX_CAROUSEL_DIRECTIVES, IgxButtonDirective } from 'igniteui-angular';

import { carouselImages } from './carousel-images';
import { SeoService } from '../services/seo.service';

@Component({
  selector: 'app-main-page',
  imports: [IGX_CAROUSEL_DIRECTIVES, IgxButtonDirective],
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent {
  carouselImages = carouselImages;

  constructor(private router: Router, private seoService: SeoService) {
    this.seoService.updateSeo({
      title: '3D печат и 3D принтиране по поръчка | Професионални услуги',
      description: 'Професионален 3D печат и 3D принтиране по поръчка. Изработка на прототипи, детайли и малки серии с високо качество и бързи срокове.',
      keywords: '3D печат, 3D принтиране, 3D печат по поръчка, 3D принтиране услуги, 3D прототипиране, 3D печат София',
      url: 'https://3dpechat.bg/',
      type: 'website'
    });
    this.seoService.removeStructuredData();
  }

  navigateToPortfolio() {
    this.router.navigate(['/portfolio']);
  }

  navigateToContact() {
    this.router.navigate(['/contact']);
  }
}
