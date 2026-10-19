import { Route, Routes } from '@angular/router';

import { localeGuard } from './i18n/provide-i18n';
import { DEFAULT_LOCALE, Locale, TRANSLATED_LOCALES } from './i18n/locales';

/**
 * Route props that put a route and everything under it in a language: the
 * guard loads and activates it before any page renders (src/i18n/README.md).
 * Spread BEFORE `path`, so the blog block keeps the `path: 'blog', children: [`
 * shape the auto-blog scaffolder's regex expects (scripts/auto-blog/preflight.js).
 */
const inLocale = (locale: Locale): Pick<Route, 'canActivate' | 'data'> => ({
  canActivate: [localeGuard],
  data: { locale }
});

const notFound: Route = {
  path: '**',
  loadComponent: () => import('./error-routing/not-found/not-found.component').then(m => m.PageNotFoundComponent)
};

/**
 * The pages that exist in every language — keep in sync with `localizedPages`
 * in src/i18n/locales.json (app.routes.spec.ts checks it). Bulgarian serves them
 * at the root, every other language under /<code>/.
 */
const localizedPages = (): Routes => [
  {
    path: '',
    loadComponent: () => import('./main-page/main-page.component').then(m => m.MainPageComponent)
  },
  {
    path: 'portfolio',
    loadComponent: () => import('./portfolio-page/portfolio-page.component').then(m => m.PortfolioPageComponent)
  },
  {
    path: 'products',
    loadComponent: () => import('./products-page/products-page.component').then(m => m.ProductsPageComponent)
  },
  {
    path: 'prices',
    loadComponent: () => import('./prices-page/prices-page.component').then(m => m.PricesPageComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./contact-me-page/contact-me-page.component').then(m => m.ContactMePageComponent)
  }
];

export const routes: Routes = [
  // /en/… (and every language added to src/i18n/locales.json). '/en/' was the
  // standalone English landing until 2026-10-18; it is now the English home page.
  ...TRANSLATED_LOCALES.map((l): Route => ({
    ...inLocale(l.code),
    path: l.code,
    children: [...localizedPages(), notFound]
  })),
  {
    ...inLocale(DEFAULT_LOCALE),
    path: '',
    children: [
      ...localizedPages(),
      {
        path: 'error',
        loadComponent: () => import('./error-routing/error/uncaught-error.component').then(m => m.UncaughtErrorComponent)
      }
    ]
  },
  {
    // Bulgarian only: articles are not translated, so the blog has no /en/ version.
    ...inLocale(DEFAULT_LOCALE),
    path: 'blog',
    children: [
      {
        path: '',
        loadComponent: () => import('./blog-list-page/blog-list-page.component').then(m => m.BlogListPageComponent),
        data: { text: 'Blog' }
      },
      // ---- Legacy URLs (renamed / merged posts) -------------------------------
      // GitHub Pages can't 301, so each old path is a prerendered stub that
      // meta-refreshes to `data.to` — see shared/legacy-redirect. Keep these
      // forever, and list new ones in LEGACY_REDIRECTS.md.
      {
        path: 'how-to-make-money-3d-printing',
        loadComponent: () => import('./shared/legacy-redirect/legacy-redirect.component').then(m => m.LegacyRedirectComponent),
        data: { to: '/blog/kak-da-pechelim-ot-3d-printiraneto/' }
      },
      {
        path: 'prozrachen-i-poluprozrachen-pla-filament-kak-da-postignete-svetlopropuskliv-3d-p',
        loadComponent: () => import('./shared/legacy-redirect/legacy-redirect.component').then(m => m.LegacyRedirectComponent),
        data: { to: '/blog/prozrachen-i-poluprozrachen-pla-filament-svetlopropuskliv-3d-pechat/' }
      },
      {
        // Removed 2026-10-17: an auto-generated story about a person who isn't
        // real (business.json neverClaim). Its closest live topic is the A1 Combo
        // beginner-printer post.
        path: '3d-printer-za-nachinaeshti-kak-edno-dete-prevarna-hobi-v-semeen-proekt',
        loadComponent: () => import('./shared/legacy-redirect/legacy-redirect.component').then(m => m.LegacyRedirectComponent),
        data: { to: '/blog/barzi-i-umni-3d-printeri/' }
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
        path: 'infill-pri-3d-pechat-platnost-zdravina-i-filament',
        loadComponent: () => import('./blog/infill-pri-3d-pechat-platnost-zdravina-i-filament/infill-pri-3d-pechat-platnost-zdravina-i-filament.component').then(m => m.InfillPri3dPechatPlatnostZdravinaIFilamentComponent)
      },
      {
        path: 'prozrachen-i-poluprozrachen-pla-filament-svetlopropuskliv-3d-pechat',
        loadComponent: () => import('./blog/prozrachen-i-poluprozrachen-pla-filament-svetlopropuskliv-3d-pechat/prozrachen-i-poluprozrachen-pla-filament-svetlopropuskliv-3d-pechat.component').then(m => m.ProzrachenIPoluprozrachenPlaFilamentSvetlopropuskliv3dPechatComponent)
      },
      {
        path: 'barzi-i-umni-3d-printeri',
        loadComponent: () => import('./blog/barzi-i-umni-3d-printeri/barzi-i-umni-3d-printeri.component').then(m => m.BarziIUmni3dPrinteriComponent)
      },
      {
        path: 'standstrap-3d-printiran-stoper-za-snoubord',
        loadComponent: () => import('./blog/standstrap-3d-printiran-stoper-za-snoubord/standstrap-3d-printiran-stoper-za-snoubord.component').then(m => m.Standstrap3dPrintiranStoperZaSnoubordComponent)
      },
      {
        path: 'monetna-karta-bulgarski-evro-moneti',
        loadComponent: () => import('./blog/monetna-karta-bulgarski-evro-moneti/monetna-karta-bulgarski-evro-moneti.component').then(m => m.MonetnaKartaBulgarskiEvroMonetiComponent)
      },
      {
        path: '3d-pechat-po-porachka-sofia-video',
        loadComponent: () => import('./blog/3d-pechat-po-porachka-sofia-video/3d-pechat-po-porachka-sofia-video.component').then(m => m.ThreeDPechatPoPorachkaSofiaVideoComponent)
      }
    ]
  },
  { ...inLocale(DEFAULT_LOCALE), ...notFound } // must always be last
];
