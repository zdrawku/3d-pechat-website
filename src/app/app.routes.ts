import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./main-page/main-page.component').then(m => m.MainPageComponent),
    data: { text: 'Home' }
  },
  {
    path: 'error',
    loadComponent: () => import('./error-routing/error/uncaught-error.component').then(m => m.UncaughtErrorComponent)
  },
  {
    path: 'portfolio',
    loadComponent: () => import('./portfolio-page/portfolio-page.component').then(m => m.PortfolioPageComponent),
    data: { text: 'Portfolio' }
  },
  {
    path: 'products',
    loadComponent: () => import('./products-page/products-page.component').then(m => m.ProductsPageComponent),
    data: { text: 'Products' }
  },
  {
    path: 'prices',
    loadComponent: () => import('./prices-page/prices-page.component').then(m => m.PricesPageComponent),
    data: { text: 'Prices' }
  },
  {
    path: 'contact',
    loadComponent: () => import('./contact-me-page/contact-me-page.component').then(m => m.ContactMePageComponent),
    data: { text: 'Contact' }
  },
  {
    path: 'blog',
    children: [
      {
        path: '',
        loadComponent: () => import('./blog-list-page/blog-list-page.component').then(m => m.BlogListPageComponent),
        data: { text: 'Blog' }
      },
      {
        path: 'how-to-make-money-3d-printing',
        loadComponent: () => import('./blog/how-to-make-money-with3d-printing/how-to-make-money-with3d-printing').then(m => m.HowToMakeMoneyWith3dPrinting)
      },
      {
        path: 'what-is-3d-printing',
        loadComponent: () => import('./blog/what-is-3d-printing/what-is-3d-printing.component').then(m => m.WhatIs3dPrintingComponent)
      },
      {
        path: '3d-printing-in-sofia-for-your-project',
        loadComponent: () => import('./blog/3d-printing-in-sofia-for-your-project/3d-printing-in-sofia-for-your-project.component').then(m => m.ThreeDPrintingInSofiaForYourProjectComponent)
      },
      {
        path: '3d-printing-technologies',
        loadComponent: () => import('./blog/3d-printing-technologies/3d-printing-technologies.component').then(m => m.ThreeDPrintingTechnologiesComponent)
      },
      {
        path: '3d-printirani-obuvki',
        loadComponent: () => import('./blog/3d-printirani-obuvki/3d-printirani-obuvki.component').then(m => m.ThreeDPrintiraniObuvkiComponent)
      },
      {
        path: 'izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish',
        loadComponent: () => import('./blog/izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish/izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish.component').then(m => m.IzglazhdaneNaPlaPri3dPrintiraneRaboteshtiMetodiZaGladakFinishComponent)
      },
      {
        path: '3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari',
        loadComponent: () => import('./blog/3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari/3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari.component').then(m => m.ThreeDPrintiraneNaWarhammerNayGotiniteFigurkiTerenIAksesoariComponent)
      },
      {
        path: 'kak-da-pechelim-ot-3d-printiraneto',
        loadComponent: () => import('./blog/kak-da-pechelim-ot-3d-printiraneto/kak-da-pechelim-ot-3d-printiraneto.component').then(m => m.KakDaPechelimOt3dPrintiranetoComponent)
      },
      {
        path: 'pla-pla-pla-pro-i-pln-razliki-i-izbor',
        loadComponent: () => import('./blog/pla-pla-pla-pro-i-pln-razliki-i-izbor/pla-pla-pla-pro-i-pln-razliki-i-izbor.component').then(m => m.PlaPlaPlaProIPlnRazlikiIIzborComponent)
      },
      {
        path: 'litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model',
        loadComponent: () => import('./blog/litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model/litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model.component').then(m => m.LitofanS3dPrintiraneKakDaPrevarneshSnimkaVSveteshtModelComponent)
      },
      {
        path: '3d-printer-bambu-lab-x2d-podrobno-revyu-funktsii-i-izbor',
        loadComponent: () => import('./blog/3d-printer-bambu-lab-x2d-podrobno-revyu-funktsii-i-izbor/3d-printer-bambu-lab-x2d-podrobno-revyu-funktsii-i-izbor.component').then(m => m.ThreeDPrinterBambuLabX2dPodrobnoRevyuFunktsiiIIzborComponent)
      },
      {
        path: '3d-printer-za-nachinaeshti-kak-edno-dete-prevarna-hobi-v-semeen-proekt',
        loadComponent: () => import('./blog/3d-printer-za-nachinaeshti-kak-edno-dete-prevarna-hobi-v-semeen-proekt/3d-printer-za-nachinaeshti-kak-edno-dete-prevarna-hobi-v-semeen-proekt.component').then(m => m.ThreeDPrinterZaNachinaeshtiKakEdnoDetePrevarnaHobiVSemeenProektComponent)
      },
      {
        path: 'infill-pri-3d-pechat-platnost-zdravina-i-filament',
        loadComponent: () => import('./blog/infill-pri-3d-pechat-platnost-zdravina-i-filament/infill-pri-3d-pechat-platnost-zdravina-i-filament.component').then(m => m.InfillPri3dPechatPlatnostZdravinaIFilamentComponent)
      },
      {
        path: 'prozrachen-i-poluprozrachen-pla-filament-kak-da-postignete-svetlopropuskliv-3d-p',
        loadComponent: () => import('./blog/prozrachen-i-poluprozrachen-pla-filament-kak-da-postignete-svetlopropuskliv-3d-p/prozrachen-i-poluprozrachen-pla-filament-kak-da-postignete-svetlopropuskliv-3d-p.component').then(m => m.ProzrachenIPoluprozrachenPlaFilamentKakDaPostigneteSvetlopropuskliv3dPComponent)
      },
      {
        path: 'vidove-filament-za-3d-printirane-kak-da-izberete-pravilniya-material',
        loadComponent: () => import('./blog/vidove-filament-za-3d-printirane-kak-da-izberete-pravilniya-material/vidove-filament-za-3d-printirane-kak-da-izberete-pravilniya-material.component').then(m => m.VidoveFilamentZa3dPrintiraneKakDaIzberetePravilniyaMaterialComponent)
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./error-routing/not-found/not-found.component').then(m => m.PageNotFoundComponent)
  } // must always be last
];
