import { Routes } from '@angular/router';

import { PageNotFoundComponent } from './error-routing/not-found/not-found.component';
import { UncaughtErrorComponent } from './error-routing/error/uncaught-error.component';
import { MainPageComponent } from './main-page/main-page.component';
import { PortfolioPageComponent } from './portfolio-page/portfolio-page.component';
import { PricesPageComponent } from './prices-page/prices-page.component';
import { ProductsPageComponent } from './products-page/products-page.component';
import { ContactMePageComponent } from './contact-me-page/contact-me-page.component';
import { BlogListPageComponent } from './blog-list-page/blog-list-page.component';
import { HowToMakeMoneyWith3dPrinting } from './blog/how-to-make-money-with3d-printing/how-to-make-money-with3d-printing';
import { WhatIs3dPrintingComponent } from './blog/what-is-3d-printing/what-is-3d-printing.component';

export const routes: Routes = [
  { path: '', component: MainPageComponent, data: { text: 'Home' } },
  { path: 'error', component: UncaughtErrorComponent },
  { path: 'portfolio', component: PortfolioPageComponent, data: { text: 'Portfolio' } },
  { path: 'products', component: ProductsPageComponent, data: { text: 'Products' } },
  { path: 'prices', component: PricesPageComponent, data: { text: 'Prices' } },
  { path: 'contact', component: ContactMePageComponent, data: { text: 'Contact' } },
  {
    path: 'blog',
    children: [
      { path: '', component: BlogListPageComponent, data: { text: 'Blog' } },
      { path: 'how-to-make-money-3d-printing', component: HowToMakeMoneyWith3dPrinting },
      { path: 'what-is-3d-printing', component: WhatIs3dPrintingComponent }
    ]
  },
  { path: '**', component: PageNotFoundComponent } // must always be last
];
