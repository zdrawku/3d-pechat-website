import { RenderMode, ServerRoute } from '@angular/ssr';

import { TRANSLATED_LOCALES, TRANSLATED_POSTS } from './i18n/locales';
import { BLOG_POSTS } from './services/blog-posts.registry';

// Every concrete route discovered in app.routes.ts is prerendered to a
// static HTML file at build time (outputMode: "static" in angular.json).
// Blog posts share one parameterised route per language, so their pages come
// from the same lists the app routes match against: every post in the
// registry, and in each other language every post translated into it.
export const serverRoutes: ServerRoute[] = [
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => BLOG_POSTS.map((post) => ({ slug: post.slug }))
  },
  ...TRANSLATED_LOCALES.map((locale): ServerRoute => ({
    path: `${locale.code}/blog/:slug`,
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => Object.values(TRANSLATED_POSTS[locale.code] ?? {}).map((slug) => ({ slug }))
  })),
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
