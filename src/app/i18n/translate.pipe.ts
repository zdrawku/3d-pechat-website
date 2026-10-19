import { Pipe, PipeTransform, inject } from '@angular/core';

import { I18nService } from './i18n.service';
import type { TranslationKey, TranslationParams } from './i18n.types';

/**
 * `{{ 'home.hero.title' | t }}`, `{{ 'contact.info.response' | t: { hours: 24 } }}`.
 *
 * The key is typed (TranslationKey), so a misspelled key fails the build.
 * Impure because the language can change while the shell (navbar, drawer,
 * footer) stays on screen; a lookup is one Map read.
 */
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: TranslationKey, params?: TranslationParams): string {
    return this.i18n.t(key, params);
  }
}

/**
 * `[routerLink]="'/contact' | localizePath"` → '/contact' on Bulgarian pages,
 * '/en/contact' on English ones. Blog posts are returned unchanged (a
 * translation has its own slug: blogPostPath()). Keep the value slash-free,
 * like every routerLink (Rule 5.4).
 */
@Pipe({ name: 'localizePath', pure: false })
export class LocalizePathPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(path: string): string {
    return this.i18n.path(path);
  }
}
