import fs from 'fs';
import path from 'path';

import { BLOG_POSTS } from '../src/app/services/blog-posts.registry';

/**
 * Single source of truth for the routes the smoke suite exercises.
 * Keep in sync with src/app/app.routes.ts. `heading` is a substring expected
 * in the page's main visible heading; `title` a substring of <title>.
 */
export interface RouteSpec {
  path: string;
  /** Substring expected somewhere in an <h1>/<h2> on the page. */
  heading?: string;
  /** Substring expected in document <title>. */
  title?: string;
  /** False for a core page that isn't a Bulgarian drawer chip (the English home page). */
  inDrawer?: boolean;
}

export const CORE_ROUTES: RouteSpec[] = [
  { path: '/', title: '3D Печат' },
  { path: '/portfolio', title: 'Портфолио' },
  { path: '/products', title: 'Продукти' },
  { path: '/products/bookmarks', heading: 'Разделители за книги', title: 'Разделители за книги' },
  { path: '/prices', title: 'Цени' },
  { path: '/contact', heading: 'Свържете се', title: 'Контакти' },
  { path: '/blog', title: 'Блог' },
  // The English home page (src/i18n/locales.json); kept here for its visual baseline.
  { path: '/en', heading: 'Professional custom 3D printing', title: 'Custom 3D Printing', inDrawer: false },
  // The legal pages, linked from the footer (not drawer chips).
  { path: '/privacy', heading: 'Политика за поверителност', title: 'Политика за поверителност', inDrawer: false },
  { path: '/terms', heading: 'Общи условия', title: 'Общи условия', inDrawer: false },
];

/**
 * The English versions of the other main pages (src/i18n/locales.json
 * `localizedPages`). Smoke, SEO, a11y and visual regression run on them (their
 * Linux baselines come from the Visual regression workflow's "update baselines" run).
 */
export const ENGLISH_ROUTES: RouteSpec[] = [
  { path: '/en/portfolio', heading: 'Products and projects modelled for 3D printing', title: 'Portfolio' },
  { path: '/en/products', heading: '3D printed products', title: 'Products' },
  { path: '/en/products/bookmarks', heading: 'Bookmarks', title: 'Bookmarks' },
  { path: '/en/prices', heading: '3D printing prices', title: 'Prices' },
  { path: '/en/contact', heading: 'Get in touch', title: 'Contact' },
  { path: '/en/blog', heading: '3D Printing Blog', title: 'Blog' },
  { path: '/en/privacy', heading: 'Privacy Policy', title: 'Privacy Policy' },
  { path: '/en/terms', heading: 'Terms of Use', title: 'Terms of Use' },
];

/**
 * Every Bulgarian post, read from the registry itself (src/app/services/
 * blog-posts.registry.ts), so a new post — the auto-blog's included — is
 * covered without editing this file.
 */
export const BLOG_ROUTES: RouteSpec[] = BLOG_POSTS.map((post) => ({ path: post.route }));

/**
 * The translated posts (src/i18n/locales.json `translatedPosts`), read from the
 * registry itself so a new translation is covered without editing this file.
 */
const locales = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'src/i18n/locales.json'), 'utf8')) as {
  translatedPosts: Record<string, Record<string, string>>;
};
export const TRANSLATED_BLOG_ROUTES: RouteSpec[] = Object.entries(locales.translatedPosts)
  .flatMap(([code, slugs]) => Object.values(slugs).map((slug) => ({ path: `/${code}/blog/${slug}` })));

export const ALL_ROUTES: RouteSpec[] = [...CORE_ROUTES, ...ENGLISH_ROUTES, ...BLOG_ROUTES, ...TRANSLATED_BLOG_ROUTES];
