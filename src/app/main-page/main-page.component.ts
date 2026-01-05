import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IGX_CAROUSEL_DIRECTIVES, IgxButtonDirective } from 'igniteui-angular';
import { CommonModule } from '@angular/common';
import { carouselImages } from './carousel-images';

@Component({
  selector: 'app-main-page',
  imports: [IGX_CAROUSEL_DIRECTIVES, IgxButtonDirective, CommonModule],
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent {
  carouselImages = carouselImages;

  constructor(private router: Router) {}

  navigateToPortfolio() {
    this.router.navigate(['/portfolio']);
  }

  navigateToContact() {
    this.router.navigate(['/contact']);
  }
}
