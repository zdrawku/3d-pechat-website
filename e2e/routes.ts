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
  { path: '/prices', title: 'Цени' },
  { path: '/contact', heading: 'Свържете се', title: 'Контакти' },
  { path: '/blog', title: 'Блог' },
  // The English home page (src/i18n/locales.json); kept here for its visual baseline.
  { path: '/en', heading: 'Professional custom 3D printing', title: 'Custom 3D Printing', inDrawer: false },
];

/**
 * The English versions of the other main pages (src/i18n/locales.json
 * `localizedPages`). Smoke, SEO and a11y run on them; visual baselines don't
 * (yet) — add them here to CORE_ROUTES when regenerating baselines.
 */
export const ENGLISH_ROUTES: RouteSpec[] = [
  { path: '/en/portfolio', heading: 'Products and projects modelled for 3D printing', title: 'Portfolio' },
  { path: '/en/products', heading: '3D printed products', title: 'Products' },
  { path: '/en/prices', heading: '3D printing prices', title: 'Prices' },
  { path: '/en/contact', heading: 'Get in touch', title: 'Contact' },
];

export const BLOG_ROUTES: RouteSpec[] = [
  '/blog/what-is-3d-printing',
  '/blog/3d-printing-in-sofia-for-your-project',
  '/blog/3d-printing-technologies',
  '/blog/3d-printirani-obuvki',
  '/blog/izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish',
  '/blog/3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari',
  '/blog/kak-da-pechelim-ot-3d-printiraneto',
  '/blog/pla-pla-pla-pro-i-pln-razliki-i-izbor',
  '/blog/litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model',
  '/blog/3d-printer-bambu-lab-x2d-podrobno-revyu-funktsii-i-izbor',
  '/blog/infill-pri-3d-pechat-platnost-zdravina-i-filament',
  '/blog/prozrachen-i-poluprozrachen-pla-filament-svetlopropuskliv-3d-pechat',
  '/blog/3d-pechat-po-porachka-sofia-video',
].map((path) => ({ path }));

export const ALL_ROUTES: RouteSpec[] = [...CORE_ROUTES, ...ENGLISH_ROUTES, ...BLOG_ROUTES];
