import { Route } from '@angular/router';

import { routes } from './app.routes';
import { localeGuard } from './i18n/provide-i18n';
import { DEFAULT_LOCALE, LOCALES, LOCALIZED_PAGES } from './i18n/locales';

/** '/' → '', '/prices/' → 'prices' — locales.json pages as route paths. */
const pagePaths = LOCALIZED_PAGES.map((page) => page.replace(/^\/|\/$/g, ''));
const childPaths = (route: Route | undefined) => (route?.children ?? []).map((child) => child.path);
const isIn = (route: Route | undefined, locale: string) =>
  !!route?.canActivate?.includes(localeGuard) && route.data?.['locale'] === locale;

describe('app routes', () => {
  it('serves every localized page under each other language, in that language', () => {
    for (const { code } of LOCALES.filter((l) => l.code !== DEFAULT_LOCALE)) {
      const group = routes.find((r) => r.path === code);
      expect(isIn(group, code)).withContext(`/${code}/ guard + data`).toBeTrue();
      expect(childPaths(group)).withContext(`/${code}/ pages`).toEqual([...pagePaths, '**']);
    }
  });

  it('serves the same pages at the root in Bulgarian', () => {
    const root = routes.find((r) => r.path === '' && r.children);
    expect(isIn(root, DEFAULT_LOCALE)).toBeTrue();
    expect(childPaths(root)).toEqual([...pagePaths, 'error']);
  });

  it('keeps the blog Bulgarian-only', () => {
    const blog = routes.find((r) => r.path === 'blog');
    expect(isIn(blog, DEFAULT_LOCALE)).toBeTrue();
    for (const { code } of LOCALES.filter((l) => l.code !== DEFAULT_LOCALE)) {
      expect(childPaths(routes.find((r) => r.path === code))).withContext(code).not.toContain('blog');
    }
  });

  it('matches the language prefixes before the Bulgarian root and ends with the Bulgarian 404', () => {
    const rootIndex = routes.findIndex((r) => r.path === '' && r.children);
    for (const { code } of LOCALES.filter((l) => l.code !== DEFAULT_LOCALE)) {
      expect(routes.findIndex((r) => r.path === code)).withContext(code).toBeLessThan(rootIndex);
    }
    const last = routes[routes.length - 1];
    expect(last.path).toBe('**');
    expect(isIn(last, DEFAULT_LOCALE)).toBeTrue();
  });
});
