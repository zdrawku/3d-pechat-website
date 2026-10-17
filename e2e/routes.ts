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
  /** False for pages reachable from the footer only (not a drawer chip), e.g. /en. */
  inDrawer?: boolean;
}

export const CORE_ROUTES: RouteSpec[] = [
  { path: '/', title: '3D Печат' },
  { path: '/portfolio', title: 'Портфолио' },
  { path: '/products', title: 'Продукти' },
  { path: '/prices', title: 'Цени' },
  { path: '/contact', heading: 'Свържете се', title: 'Контакти' },
  { path: '/blog', title: 'Блог' },
  { path: '/en', heading: 'Custom 3D printing', title: 'Custom 3D Printing', inDrawer: false },
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

export const ALL_ROUTES: RouteSpec[] = [...CORE_ROUTES, ...BLOG_ROUTES];
