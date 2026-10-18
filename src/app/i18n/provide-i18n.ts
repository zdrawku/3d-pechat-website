import { PlatformLocation } from '@angular/common';
import { EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
import { CanActivateFn } from '@angular/router';

import { I18nService } from './i18n.service';
import { isLocale, splitLocalePath } from './locales';

/**
 * Activates the URL's language before the app renders anything, so the shell
 * (navbar, drawer, footer) is in the right language on the first render — on
 * the server during prerender, and in the browser before hydration, which
 * keeps the two identical.
 */
export function provideI18n(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const i18n = inject(I18nService);
    const { locale } = splitLocalePath(inject(PlatformLocation).pathname);
    return i18n.use(locale);
  });
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
