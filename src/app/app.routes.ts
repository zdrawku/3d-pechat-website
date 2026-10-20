import { inject } from '@angular/core';
import { Route, Routes } from '@angular/router';

import { articleRoute } from './blog/article/article.routes';
import { localeGuard } from './i18n/provide-i18n';
import { I18nService } from './i18n/i18n.service';
import { DEFAULT_LOCALE, Locale, TRANSLATED_LOCALES } from './i18n/locales';

/**
 * Route props that put a route and everything under it in a language: the
 * guard loads and activates it before any page renders (src/i18n/README.md).
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
 * at the root, every other language under /<code>/. The blog index, also in
 * `localizedPages`, is part of each language's blog block instead.
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
  },
  // Privacy Policy and Terms of Use: one page component, the text from
  // src/legal/<lang>/<doc>.md (legal-page/legal-docs.ts).
  ...(['privacy', 'terms'] as const).map((doc): Route => ({
    path: doc,
    loadComponent: () => import('./legal-page/legal-page.component').then(m => m.LegalPageComponent),
    resolve: {
      // The language is read here, in the injection context; the localeGuard has set it.
      legalText: () => {
        const locale = inject(I18nService).locale();
        return import('./legal-page/legal-docs').then(m => m.loadLegalText(doc, locale));
      }
    },
    data: { doc }
  }))
];

const blogIndex: Route = {
  path: '',
  loadComponent: () => import('./blog-list-page/blog-list-page.component').then(m => m.BlogListPageComponent)
};

/**
 * Old blog URLs (renamed / merged / removed posts). GitHub Pages can't 301, so
 * each is a prerendered stub that meta-refreshes to `data.to` — see
 * shared/legacy-redirect. Keep these forever, list new ones in
 * LEGACY_REDIRECTS.md, and keep them before the post route that would match them.
 */
const legacyBlogRedirects: Routes = [
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
  }
];

export const routes: Routes = [
  // /en/… (and every language added to src/i18n/locales.json). '/en/' was the
  // standalone English landing until 2026-10-18; it is now the English home page.
  // Its blog lists and serves the posts translated into it.
  ...TRANSLATED_LOCALES.map((l): Route => ({
    ...inLocale(l.code),
    path: l.code,
    children: [...localizedPages(), { path: 'blog', children: [blogIndex, articleRoute(l.code)] }, notFound]
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
    // The Bulgarian blog: every post in blog-posts.registry.ts, through one
    // route (blog/article/article.routes.ts) — a new post needs no route here.
    ...inLocale(DEFAULT_LOCALE),
    path: 'blog',
    children: [blogIndex, ...legacyBlogRedirects, articleRoute(DEFAULT_LOCALE)]
  },
  { ...inLocale(DEFAULT_LOCALE), ...notFound } // must always be last
];
