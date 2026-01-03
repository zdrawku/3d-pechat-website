import { Routes } from '@angular/router';

import { PageNotFoundComponent } from './error-routing/not-found/not-found.component';
import { UncaughtErrorComponent } from './error-routing/error/uncaught-error.component';
import { MainPageComponent } from './main-page/main-page.component';
import { PortfolioPageComponent } from './portfolio-page/portfolio-page.component';
import { PricesPageComponent } from './prices-page/prices-page.component';
import { ContactMePageComponent } from './contact-me-page/contact-me-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'main-page', pathMatch: 'full' },
  { path: 'error', component: UncaughtErrorComponent },
  { path: 'main-page', component: MainPageComponent, data: { text: 'Main-Page' } },
  { path: 'portfolio-page', component: PortfolioPageComponent, data: { text: 'Portfolio-Page' } },
  { path: 'prices-page', component: PricesPageComponent, data: { text: 'Prices-Page' } },
  { path: 'contact-me-page', component: ContactMePageComponent, data: { text: 'Contact-Me-Page' } },
  { path: '**', component: PageNotFoundComponent } // must always be last
];
