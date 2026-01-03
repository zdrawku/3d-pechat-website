import { Component } from '@angular/core';
import { IGX_CAROUSEL_DIRECTIVES } from 'igniteui-angular';
import { CommonModule } from '@angular/common';
import { carouselImages } from './carousel-images';

@Component({
  selector: 'app-portfolio-page',
  imports: [IGX_CAROUSEL_DIRECTIVES, CommonModule],
  templateUrl: './portfolio-page.component.html',
  styleUrls: ['./portfolio-page.component.scss']
})
export class PortfolioPageComponent {
  carouselImages = carouselImages;
}
