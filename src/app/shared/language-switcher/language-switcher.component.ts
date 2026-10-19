import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  CloseScrollStrategy,
  ConnectedPositioningStrategy,
  HorizontalAlignment,
  IGX_DROP_DOWN_DIRECTIVES,
  ISelectionEventArgs,
  IgxButtonDirective,
  IgxIconComponent,
  IgxToggleActionDirective,
  OverlaySettings,
  VerticalAlignment
} from 'igniteui-angular';

import { I18nService } from '../../i18n/i18n.service';
import { LOCALES, isLocale, switchLocaleUrl } from '../../i18n/locales';
import { TranslatePipe } from '../../i18n/translate.pipe';

let nextId = 0;

/**
 * Navbar language switcher — approved design „A“ (FEATURE-IDEAS-PLAN.md,
 * artifact "Language switcher variants"): a globe + language-code pill that
 * opens an Ignite drop-down listing every language by its own name.
 *
 * Choosing a language navigates to the same page in that language
 * (/prices/ ↔ /en/prices/), or to that language's home page from a
 * Bulgarian-only page such as a blog post. The languages come from
 * src/i18n/locales.json, so a new language shows up here by itself.
 *
 * The menu items only exist while it is open, so crawlers find the language
 * versions through hreflang and the footer's plain language links instead.
 */
@Component({
  selector: 'app-language-switcher',
  // No IgxPrefix/IgxSuffix import: the item's [igxPrefix]/[igxSuffix] slots
  // match the bare attribute, and importing the directives would pull the whole
  // input-group chunk into the initial bundle for nothing.
  imports: [IGX_DROP_DOWN_DIRECTIVES, IgxButtonDirective, IgxIconComponent, IgxToggleActionDirective, TranslatePipe],
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.scss']
})
export class LanguageSwitcherComponent {
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  protected readonly locales = LOCALES;
  protected readonly current = this.i18n.definition;
  protected readonly triggerId = `language-switcher-${nextId++}`;

  /** Right-aligned under the pill (it sits near the navbar's right edge); closes on scroll. */
  protected readonly overlaySettings: OverlaySettings = {
    positionStrategy: new ConnectedPositioningStrategy({
      horizontalStartPoint: HorizontalAlignment.Right,
      horizontalDirection: HorizontalAlignment.Left,
      verticalStartPoint: VerticalAlignment.Bottom,
      verticalDirection: VerticalAlignment.Bottom
    }),
    scrollStrategy: new CloseScrollStrategy(),
    closeOnOutsideClick: true,
    modal: false
  };

  protected onSelectionChanging(event: ISelectionEventArgs): void {
    const target: unknown = event.newSelection?.value;
    if (!isLocale(target) || target === this.i18n.locale()) {
      return;
    }
    void this.router.navigateByUrl(switchLocaleUrl(this.router.url, target));
  }
}
