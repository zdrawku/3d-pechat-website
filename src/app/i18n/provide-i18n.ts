import { DOCUMENT, PlatformLocation, isPlatformBrowser } from '@angular/common';
import {
  EnvironmentProviders,
  InjectionToken,
  PLATFORM_ID,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  provideEnvironmentInitializer
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CanActivateFn, NavigationCancel, NavigationEnd, NavigationError, Router } from '@angular/router';
import { filter } from 'rxjs';

import { I18nService } from './i18n.service';
import { isLocale, splitLocalePath } from './locales';

/**
 * Reloads the page at most once per path and browser session; false when it
 * won't (already tried, on the server, or no session storage — never risk a
 * reload loop). A token so tests can replace it.
 */
export const RELOAD_ONCE = new InjectionToken<() => boolean>('RELOAD_ONCE', {
  providedIn: 'root',
  factory: () => {
    const view = inject(DOCUMENT).defaultView;
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    return () => {
      if (!browser || !view) {
        return false;
      }
      try {
        const key = `i18n-reload:${view.location.pathname}`;
        if (view.sessionStorage.getItem(key)) {
          return false;
        }
        view.sessionStorage.setItem(key, '1');
      } catch {
        return false;
      }
      view.location.reload();
      return true;
    };
  }
});

/**
 * Activates the URL's language before the app renders anything, so the shell
 * (navbar, drawer, footer) is in the right language on the first render — on
 * the server during prerender, and in the browser before hydration, which
 * keeps the two identical. If that language's strings don't load (a network
 * blip, or an HTML page cached from before a deploy whose chunks are gone), the
 * page reloads once; after that the prerendered page stays as it is — readable,
 * its links plain links — rather than hydrating in the wrong language.
 *
 * After every navigation — finished, cancelled or failed — the language is
 * re-read from the URL of the page actually shown: `localeGuard` switches it
 * before a navigation commits, and that navigation can still be superseded by a
 * newer click or fail to load its page.
 */
export function provideI18n(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      const i18n = inject(I18nService);
      const reloadOnce = inject(RELOAD_ONCE);
      const { locale } = splitLocalePath(inject(PlatformLocation).pathname);
      return i18n.use(locale).catch((error: unknown) => {
        if (reloadOnce()) {
          return new Promise<void>(() => undefined); // the page is reloading: never render this one
        }
        throw error;
      });
    }),
    provideEnvironmentInitializer(() => {
      const router = inject(Router);
      const i18n = inject(I18nService);
      router.events
        .pipe(
          filter((e) => e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError),
          takeUntilDestroyed()
        )
        .subscribe(() => {
          // Until a navigation has succeeded, the page shown is the prerendered
          // one, in the language the initializer set.
          if (router.navigated) {
            void i18n.use(splitLocalePath(router.url).locale);
          }
        });
    })
  ]);
}

/**
 * Puts a route subtree in a language (`data: { locale: 'en' }`): loads that
 * language's strings, then activates it, before any of its pages render.
 * Navigating between languages in the browser goes through here.
 */
export const localeGuard: CanActivateFn = async (route) => {
  const i18n = inject(I18nService);
  const locale: unknown = route.data['locale'];
  if (isLocale(locale)) {
    await i18n.use(locale);
  }
  return true;
};
