import { Route, UrlSegment } from '@angular/router';

import { routes } from './app.routes';
import { serverRoutes } from './app.routes.server';
import { isPostIn, postSource } from './blog/article/article.routes';
import { localeGuard } from './i18n/provide-i18n';
import { DEFAULT_LOCALE, LOCALIZED_PAGES, TRANSLATED_LOCALES, TRANSLATED_POSTS } from './i18n/locales';
import { BLOG_POSTS } from './services/blog-posts.registry';

/** '/' → '', '/prices/' → 'prices' — locales.json pages as route paths (the blog index included). */
const pagePaths = LOCALIZED_PAGES.map((page) => page.replace(/^\/|\/$/g, ''));
const childPaths = (route: Route | undefined) => (route?.children ?? []).map((child) => child.path);
const isIn = (route: Route | undefined, locale: string) =>
  !!route?.canActivate?.includes(localeGuard) && route.data?.['locale'] === locale;

describe('app routes', () => {
  it('serves every localized page under each other language, in that language', () => {
    for (const { code } of TRANSLATED_LOCALES) {
      const group = routes.find((r) => r.path === code);
      expect(isIn(group, code)).withContext(`/${code}/ guard + data`).toBeTrue();
      expect(childPaths(group)).withContext(`/${code}/ pages`).toEqual([...pagePaths, '**']);
    }
  });

  it('serves the same pages at the root in Bulgarian, the blog in its own block', () => {
    const root = routes.find((r) => r.path === '' && r.children);
    expect(isIn(root, DEFAULT_LOCALE)).toBeTrue();
    expect(childPaths(root)).toEqual([...pagePaths.filter((p) => p !== 'blog'), 'error']);
  });

  it('serves the Bulgarian blog: its index, the old URLs, then one route for every post', () => {
    const blog = routes.find((r) => r.path === 'blog');
    expect(isIn(blog, DEFAULT_LOCALE)).toBeTrue();
    const paths = childPaths(blog);
    expect(paths[0]).toBe('');
    expect(paths[paths.length - 1]).toBe(':slug');
    // Every old URL comes before the post route, which would match it too.
    expect(paths.slice(1, -1).length).toBeGreaterThan(0);
    for (const legacy of blog!.children!.slice(1, -1)) {
      expect(legacy.data?.['to']).withContext(legacy.path ?? '').toMatch(/^\/blog\/[a-z0-9-]+\/$/);
    }
  });

  it('serves each other language’s blog: its index and one route for every translated post', () => {
    for (const { code } of TRANSLATED_LOCALES) {
      const blog = routes.find((r) => r.path === code)?.children?.find((r) => r.path === 'blog');
      expect(childPaths(blog)).withContext(code).toEqual(['', ':slug']);
    }
  });

  it('matches a post route only for a post that exists in that language', async () => {
    const segment = (path: string) => [new UrlSegment(path, {})];
    const bulgarian = isPostIn('bg') as (route: Route, segments: UrlSegment[]) => Promise<boolean>;
    const english = isPostIn('en') as (route: Route, segments: UrlSegment[]) => Promise<boolean>;
    for (const post of BLOG_POSTS) {
      expect(await bulgarian({}, segment(post.slug))).withContext(post.slug).toBeTrue();
    }
    for (const slug of Object.values(TRANSLATED_POSTS.en ?? {})) {
      expect(await english({}, segment(slug))).withContext(slug).toBeTrue();
    }
    expect(await bulgarian({}, segment('no-such-post'))).toBeFalse();
    expect(await english({}, segment('what-is-3d-printing'))).withContext('a Bulgarian slug').toBeFalse();
    expect(await postSource('pla-vs-pla-plus-vs-pla-pro-vs-pln', 'en')).toBe('pla-pla-pla-pro-i-pln-razliki-i-izbor');
  });

  it('prerenders every post in every language it exists in (app.routes.server.ts)', async () => {
    const params = async (path: string) => {
      const route = serverRoutes.find((r) => r.path === path) as { getPrerenderParams?: () => Promise<Record<string, string>[]> };
      return (await route?.getPrerenderParams?.())?.map((p) => p['slug']) ?? [];
    };
    expect(await params('blog/:slug')).toEqual(BLOG_POSTS.map((p) => p.slug));
    for (const { code } of TRANSLATED_LOCALES) {
      expect(await params(`${code}/blog/:slug`)).withContext(code).toEqual(Object.values(TRANSLATED_POSTS[code] ?? {}));
    }
    expect(serverRoutes[serverRoutes.length - 1].path).toBe('**');
  });

  it('matches the language prefixes before the Bulgarian root and ends with the Bulgarian 404', () => {
    const rootIndex = routes.findIndex((r) => r.path === '' && r.children);
    for (const { code } of TRANSLATED_LOCALES) {
      expect(routes.findIndex((r) => r.path === code)).withContext(code).toBeLessThan(rootIndex);
    }
    const last = routes[routes.length - 1];
    expect(last.path).toBe('**');
    expect(isIn(last, DEFAULT_LOCALE)).toBeTrue();
  });
});
