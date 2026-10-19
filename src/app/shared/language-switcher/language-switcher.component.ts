import { Component, inject, signal } from '@angular/core';
import { IgxButtonDirective, IgxIconComponent } from 'igniteui-angular';

import { I18nService } from '../../i18n/i18n.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import type { LanguageMenuHandle } from './language-menu.api';
import { LanguageMenuComponent } from './language-menu.component';

let nextId = 0;

/**
 * Navbar language switcher — approved design „A“ (FEATURE-IDEAS-PLAN.md,
 * artifact "Language switcher variants"): a globe + language-code pill that
 * opens an Ignite drop-down listing every language by its own name.
 *
 * Choosing a language navigates to the same page in that language
 * (/prices/ ↔ /en/prices/, a blog post ↔ its translation), to that language's
 * blog from a post that isn't translated into it, or else to its home page
 * (switchLocaleUrl). The languages come from src/i18n/locales.json, so a new
 * language shows up here by itself.
 *
 * Only the pill ships with every page. The menu (LanguageMenuComponent, with
 * Ignite's drop-down module) is a `@defer` block: prefetched when the browser
 * is idle and created on the pill's first click, so it costs nothing up front.
 *
 * The menu items only exist while it is open, so crawlers find the language
 * versions through hreflang and the footer's plain language links instead.
 */
@Component({
  selector: 'app-language-switcher',
  imports: [IgxButtonDirective, IgxIconComponent, TranslatePipe, LanguageMenuComponent],
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.scss']
})
export class LanguageSwitcherComponent {
  protected readonly i18n = inject(I18nService);

  protected readonly current = this.i18n.definition;
  protected readonly triggerId = `language-switcher-${nextId++}`;

  /** Set by the first click: creates the deferred menu, which opens on creation. */
  protected readonly requested = signal(false);
  /** Whether the menu is open (aria-expanded, the caret and the orange border). */
  protected readonly expanded = signal(false);
  /** The menu, once it exists — see LanguageMenuHandle for why not a viewChild. */
  private menu: LanguageMenuHandle | null = null;

  protected toggle(): void {
    if (!this.requested()) {
      this.requested.set(true);
      return;
    }
    this.menu?.toggle();
  }

  protected onKeydown(event: KeyboardEvent): void {
    this.menu?.handleKeyDown(event);
  }

  protected onMenuReady(menu: LanguageMenuHandle): void {
    this.menu = menu;
  }
}
