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
import { ThreeDPrintingInSofiaForYourProjectComponent } from './blog/3d-printing-in-sofia-for-your-project/3d-printing-in-sofia-for-your-project.component';
import { ThreeDPrintingTechnologiesComponent } from './blog/3d-printing-technologies/3d-printing-technologies.component';
import { ThreeDPrintiraniObuvkiComponent } from './blog/3d-printirani-obuvki/3d-printirani-obuvki.component';
import { IzglazhdaneNaPlaPri3dPrintiraneRaboteshtiMetodiZaGladakFinishComponent } from './blog/izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish/izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish.component';
import { ThreeDPrintiraneNaWarhammerNayGotiniteFigurkiTerenIAksesoariComponent } from './blog/3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari/3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari.component';
import { PlaPlaPlaProIPlnRazlikiIIzborComponent } from './blog/pla-pla-pla-pro-i-pln-razliki-i-izbor/pla-pla-pla-pro-i-pln-razliki-i-izbor.component';

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
      { path: 'what-is-3d-printing', component: WhatIs3dPrintingComponent },
      { path: '3d-printing-in-sofia-for-your-project', component: ThreeDPrintingInSofiaForYourProjectComponent },
      { path: '3d-printing-technologies', component: ThreeDPrintingTechnologiesComponent },
      { path: '3d-printirani-obuvki', component: ThreeDPrintiraniObuvkiComponent },
      { path: 'izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish', component: IzglazhdaneNaPlaPri3dPrintiraneRaboteshtiMetodiZaGladakFinishComponent },
      { path: '3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari', component: ThreeDPrintiraneNaWarhammerNayGotiniteFigurkiTerenIAksesoariComponent },
      { path: 'pla-pla-pla-pro-i-pln-razliki-i-izbor', component: PlaPlaPlaProIPlnRazlikiIIzborComponent }
    ]
  },
  { path: '**', component: PageNotFoundComponent } // must always be last
];
