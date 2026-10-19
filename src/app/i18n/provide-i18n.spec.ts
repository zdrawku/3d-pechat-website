import { DOCUMENT, PlatformLocation } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { ApplicationInitStatus, Component, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes, type ActivatedRouteSnapshot, type RouterStateSnapshot } from '@angular/router';

import { I18nService } from './i18n.service';
import { RELOAD_ONCE, localeGuard, provideI18n } from './provide-i18n';

const settle = () => new Promise((resolve) => setTimeout(resolve));

describe('provideI18n', () => {
  afterEach(() => TestBed.inject(DOCUMENT).documentElement.setAttribute('lang', 'bg'));

  /** Runs the app initializers with the browser at `pathname`. */
  async function bootAt(pathname: string): Promise<I18nService> {
    TestBed.configureTestingModule({
      providers: [provideI18n(), provideLocationMocks(), { provide: PlatformLocation, useValue: { pathname } }]
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    return TestBed.inject(I18nService);
  }

  for (const pathname of ['/en/', '/en', '/en/prices/']) {
    it(`activates English before the first render at ${pathname}`, async () => {
      const i18n = await bootAt(pathname);
      expect(i18n.locale()).toBe('en');
      expect(i18n.t('shell.navbar.menu')).toBe('Menu');
      expect(TestBed.inject(DOCUMENT).documentElement.getAttribute('lang')).toBe('en');
    });
  }

  for (const pathname of ['/', '/prices/', '/blog/what-is-3d-printing/']) {
    it(`stays Bulgarian at ${pathname}`, async () => {
      expect((await bootAt(pathname)).locale()).toBe('bg');
    });
  }

  describe('when the URL’s language doesn’t load', () => {
    /** Boots /en/prices/ with an English chunk that fails; `reloads` = what RELOAD_ONCE answers. */
    function bootWithFailingEnglish(reloads: boolean) {
      const reloadOnce = jasmine.createSpy('reloadOnce').and.returnValue(reloads);
      TestBed.configureTestingModule({
        providers: [
          provideI18n(),
          provideLocationMocks(),
          { provide: PlatformLocation, useValue: { pathname: '/en/prices/' } },
          { provide: I18nService, useValue: { use: () => Promise.reject(new Error('chunk failed')) } },
          { provide: RELOAD_ONCE, useValue: reloadOnce }
        ]
      });
      return { status: TestBed.inject(ApplicationInitStatus), reloadOnce };
    }

    it('reloads the page instead of rendering it in the wrong language', async () => {
      const { status, reloadOnce } = bootWithFailingEnglish(true);
      await settle();
      expect(reloadOnce).toHaveBeenCalledTimes(1);
      expect(status.done).withContext('startup waits for the reload').toBeFalse();
    });

    it('gives up after one reload: startup fails and the prerendered page stays as it is', async () => {
      const { status } = bootWithFailingEnglish(false);
      await expectAsync(status.donePromise).toBeRejectedWithError('chunk failed');
    });
  });

  describe('RELOAD_ONCE', () => {
    it('does not reload a path it already reloaded this session', () => {
      const key = `i18n-reload:${location.pathname}`;
      sessionStorage.setItem(key, '1');
      try {
        expect(TestBed.inject(RELOAD_ONCE)()).toBeFalse();
      } finally {
        sessionStorage.removeItem(key);
      }
    });

    it('never reloads on the server', () => {
      TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
      expect(TestBed.inject(RELOAD_ONCE)()).toBeFalse();
    });
  });
});

@Component({ template: '' })
class BlankComponent { }

describe('provideI18n with the router', () => {
  // The shape of app.routes.ts: a parent route per language, guarded by localeGuard.
  const routes: Routes = [
    {
      path: 'en',
      canActivate: [localeGuard],
      data: { locale: 'en' },
      children: [
        { path: 'page', component: BlankComponent },
        { path: 'broken', loadComponent: () => Promise.reject(new Error('chunk failed')) }
      ]
    },
    {
      path: '',
      canActivate: [localeGuard],
      data: { locale: 'bg' },
      children: [
        { path: 'page', component: BlankComponent },
        { path: 'other', component: BlankComponent }
      ]
    }
  ];

  let router: Router;
  let i18n: I18nService;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideI18n(), provideRouter(routes), provideLocationMocks()] });
    router = TestBed.inject(Router);
    i18n = TestBed.inject(I18nService);
    await router.navigateByUrl('/page');
  });

  afterEach(() => TestBed.inject(DOCUMENT).documentElement.setAttribute('lang', 'bg'));

  it('follows the URL of every finished navigation', async () => {
    await router.navigateByUrl('/en/page');
    expect(i18n.locale()).toBe('en');
    await router.navigateByUrl('/other');
    await settle();
    expect(i18n.locale()).toBe('bg');
  });

  it('keeps the page’s language when a newer click cancels a navigation into another language', async () => {
    // Hold the English strings back, as on a slow connection.
    let finishLoading!: () => void;
    const englishLoaded = new Promise<void>((resolve) => (finishLoading = resolve));
    const load = i18n.load.bind(i18n);
    let englishRequested = false;
    spyOn(i18n, 'load').and.callFake((locale) => {
      englishRequested ||= locale === 'en';
      return locale === 'en' ? englishLoaded.then(() => load('en')) : load(locale);
    });

    const toEnglish = router.navigateByUrl('/en/page');
    for (let i = 0; i < 50 && !englishRequested; i++) {
      await settle();
    }
    expect(englishRequested).withContext('the guard started switching to English').toBeTrue();

    // The newer click stays under the Bulgarian parent route, so no guard runs for it.
    await router.navigateByUrl('/other');
    expect(await toEnglish).withContext('the English navigation was cancelled').toBeFalse();

    // Let the English strings arrive and the cancelled guard's use('en') finish.
    finishLoading();
    await load('en');
    await settle();
    expect(router.url).toBe('/other');
    expect(i18n.locale()).toBe('bg');
    expect(TestBed.inject(DOCUMENT).documentElement.getAttribute('lang')).toBe('bg');
  });

  it('keeps the page’s language when the other language’s page fails to load', async () => {
    await expectAsync(router.navigateByUrl('/en/broken')).toBeRejected();
    await settle();
    expect(router.url).toBe('/page');
    expect(i18n.locale()).toBe('bg');
  });
});

describe('localeGuard', () => {
  afterEach(() => TestBed.inject(DOCUMENT).documentElement.setAttribute('lang', 'bg'));

  const run = (data: Record<string, unknown>) =>
    TestBed.runInInjectionContext(() =>
      localeGuard({ data } as unknown as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    ) as Promise<boolean>;

  it('loads and activates the route’s language, then lets the navigation through', async () => {
    const i18n = TestBed.inject(I18nService);
    expect(await run({ locale: 'en' })).toBeTrue();
    expect(i18n.locale()).toBe('en');
    expect(i18n.t('shell.navbar.menu')).toBe('Menu');

    expect(await run({ locale: 'bg' })).toBeTrue();
    expect(i18n.locale()).toBe('bg');
  });

  it('leaves the language alone for a route without a known one', async () => {
    const i18n = TestBed.inject(I18nService);
    expect(await run({})).toBeTrue();
    expect(await run({ locale: 'xx' })).toBeTrue();
    expect(i18n.locale()).toBe('bg');
  });
});
