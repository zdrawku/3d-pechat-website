import { Routes } from '@angular/router';

import { PageNotFoundComponent } from './error-routing/not-found/not-found.component';
import { UncaughtErrorComponent } from './error-routing/error/uncaught-error.component';
import { MainPageComponent } from './main-page/main-page.component';
import { PortfolioPageComponent } from './portfolio-page/portfolio-page.component';
import { PricesPageComponent } from './prices-page/prices-page.component';
import { ProductsPageComponent } from './products-page/products-page.component';
import { ContactMePageComponent } from './contact-me-page/contact-me-page.component';

export const routes: Routes = [
  { path: '', component: MainPageComponent, data: { text: 'Home' } },
  { path: 'error', component: UncaughtErrorComponent },
  { path: 'portfolio', component: PortfolioPageComponent, data: { text: 'Portfolio' } },
  { path: 'products', component: ProductsPageComponent, data: { text: 'Products' } },
  { path: 'prices', component: PricesPageComponent, data: { text: 'Prices' } },
  { path: 'contact', component: ContactMePageComponent, data: { text: 'Contact' } },
  { path: '**', component: PageNotFoundComponent } // must always be last
];
