# End-to-end tests (Playwright)

Smoke, SEO, and contact-form tests that run against the **built, prerendered
site** — the same static HTML that real users and Googlebot receive.

## Running

```bash
# Full run: builds the static site, serves it, runs the suite, tears down.
npm run e2e

# Interactive UI mode (great for debugging a single test).
npm run e2e:ui

# Open the HTML report from the last run.
npm run e2e:report
```

### Faster local iteration

The default run does a full production build (a few minutes). If you already
have a server running, point the tests at it and skip the build:

```bash
# In one terminal — serve an existing build:
npx http-server dist/dprinting-services-website/browser -p 8080 -s

# In another — run tests against it:
PW_BASE_URL=http://localhost:8080 npm run e2e
```

`PW_BASE_URL` also lets you run against the dev server (`ng serve`, port 4200)
or a deployed URL.

## What's covered

**Structural (per route):**

- **`smoke.spec.ts`** — every route (home, portfolio, products, prices,
  contact, blog list + each blog post) loads with a 200, renders the app shell
  (navbar + footer), has the expected title, and produces **no JS errors and no
  failed resource loads** (this is what caught a broken blog image). Plus
  drawer/CTA navigation and the 404 fallback.
- **`seo.spec.ts`** — each route has a non-empty `<title>`, meta description,
  canonical link, and Open Graph tags; `sitemap.xml` lists every route;
  `robots.txt` references the sitemap. Protects indexing from silent regressions.

**Behaviour (per feature):**

- **`products.spec.ts`** — search filters the grid, sort (newest/oldest/А-Я)
  reorders, the count line matches rendered cards, the empty state + reset work,
  and "order" navigates to contact with a prefilled message. (Products are a
  hardcoded array — there's no "add product" UI to test.)
- **`prices.spec.ts`** — the calculator: `(grams / 10) × tier rate`, tier
  switching, empty-grams → 0.00 (no NaN), and "order with this price" navigating
  to contact with the estimate prefilled.
- **`blog-list.spec.ts`** — search, tag-click filtering, the no-results state,
  and a **data-driven check that every listed card links to a page that
  renders** (this automatically covers any newly added blog).
- **`contact-form.spec.ts`** — required-field validation, per-field hints, the
  hCaptcha gate (backend must not be called without a token), and prefill when
  arriving from a product order. Web3Forms + hCaptcha are stubbed, so hermetic.
  The full submit→success path is intentionally left to a future unit test of
  `sendEmail()` (needs the private captcha token).
- **`shell.spec.ts`** — theme toggle (class on `<html>` + localStorage
  persistence across reload), the mobile nav drawer, and external/social link
  hrefs with safe `rel="noopener"`.

## Selectors

Interaction tests target `data-testid` attributes on the relevant elements
(e.g. `product-search`, `calc-grams`, `theme-toggle`). Prefer adding a
`data-testid` over a CSS-class selector when writing new tests — classes change
during restyling, testids don't.

`routes.ts` is the shared list of routes. **Keep it in sync with
`src/app/app.routes.ts`** when adding or removing pages.

## Adding a page

1. Add the route to `src/app/app.routes.ts` (as usual).
2. Add its path to `e2e/routes.ts` (`CORE_ROUTES` or `BLOG_ROUTES`).

That's it — the smoke and SEO suites iterate over the list automatically.

## CI

`.github/workflows/e2e.yml` runs the suite on every push/PR to `main` and
uploads the HTML report as an artifact (handy for eyeballing failures).
