import { AfterViewInit, Component, inject, input, output, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import {
  CloseScrollStrategy,
  ConnectedPositioningStrategy,
  DropDownActionKey,
  HorizontalAlignment,
  IGX_DROP_DOWN_DIRECTIVES,
  ISelectionEventArgs,
  IgxDropDownComponent,
  IgxIconComponent,
  OverlaySettings,
  VerticalAlignment
} from 'igniteui-angular';

import { I18nService } from '../../i18n/i18n.service';
import { AnalyticsService } from '../../services/analytics.service';
import { LOCALES, isLocale, switchLocaleUrl } from '../../i18n/locales';
import { TranslatePipe } from '../../i18n/translate.pipe';
import type { LanguageMenuHandle } from './language-menu.api';

/**
 * The language switcher's menu (approved design „A“): an Ignite drop-down
 * listing every language by its own name. It is loaded only when the pill is
 * first used (or the browser is idle — `@defer` in the switcher), which keeps
 * the drop-down module (~9 kB) out of every page's initial bundle.
 *
 * The pill stays outside, in the switcher, so the menu is driven from there:
 * it opens on creation, `toggle()` follows clicks, and `handleKeyDown()` gets
 * the pill's keys — the same handling as Ignite's igxDropDownItemNavigation,
 * which can only sit on an element in this template.
 */
@Component({
  selector: 'app-language-menu',
  // No IgxPrefix/IgxSuffix import: the item's [igxPrefix]/[igxSuffix] slots
  // match the bare attribute, and importing the directives would pull the whole
  // input-group package in for nothing.
  imports: [IGX_DROP_DOWN_DIRECTIVES, IgxIconComponent, TranslatePipe],
  templateUrl: './language-menu.component.html',
  styleUrls: ['./language-menu.component.scss']
})
export class LanguageMenuComponent implements AfterViewInit, LanguageMenuHandle {
  /** The pill: the menu opens under it, and its clicks don't count as outside clicks. */
  readonly target = input.required<HTMLElement>();
  /** The pill's id, which names the list for screen readers. */
  readonly labelledBy = input.required<string>();
  /** True while the menu is open — the pill's aria-expanded, caret and border follow it. */
  readonly expanded = output<boolean>();
  /** This menu's controls, for the pill (see LanguageMenuHandle). */
  readonly ready = output<LanguageMenuHandle>();

  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);
  private readonly dropDown = viewChild.required(IgxDropDownComponent);

  protected readonly locales = LOCALES;
  protected readonly current = this.i18n.definition;

  /** Right-aligned under the pill (it sits near the navbar's right edge); closes on scroll. */
  private overlaySettings(): OverlaySettings {
    return {
      target: this.target(),
      positionStrategy: new ConnectedPositioningStrategy({
        horizontalStartPoint: HorizontalAlignment.Right,
        horizontalDirection: HorizontalAlignment.Left,
        verticalStartPoint: VerticalAlignment.Bottom,
        verticalDirection: VerticalAlignment.Bottom
      }),
      scrollStrategy: new CloseScrollStrategy(),
      closeOnOutsideClick: true,
      excludeFromOutsideClick: [this.target()],
      modal: false
    };
  }

  /** The pill's first click is what created this menu, so it opens straight away. */
  ngAfterViewInit(): void {
    this.ready.emit(this);
    this.dropDown().open(this.overlaySettings());
  }

  /** Ignite's toggle: it also reopens a menu whose close animation is still running (a quick second click). */
  toggle(): void {
    this.dropDown().toggle(this.overlaySettings());
  }

  /**
   * Keys pressed on the pill while the menu is open: arrows / Home / End move,
   * Enter / Space choose, Escape / Tab close (igxDropDownItemNavigation's
   * behaviour). While it is closed the pill keeps its own keys — Enter / Space
   * click it, which opens the menu.
   */
  handleKeyDown(event: KeyboardEvent): void {
    const dropDown = this.dropDown();
    if (dropDown.collapsed) {
      return;
    }
    const key = event.key.toLowerCase();
    const actions: Record<string, () => void> = {
      escape: () => dropDown.onItemActionKey(DropDownActionKey.ESCAPE, event),
      esc: () => dropDown.onItemActionKey(DropDownActionKey.ESCAPE, event),
      enter: () => dropDown.onItemActionKey(DropDownActionKey.ENTER, event),
      ' ': () => dropDown.onItemActionKey(DropDownActionKey.SPACE, event),
      spacebar: () => dropDown.onItemActionKey(DropDownActionKey.SPACE, event),
      arrowdown: () => dropDown.navigateNext(),
      down: () => dropDown.navigateNext(),
      arrowup: () => dropDown.navigatePrev(),
      up: () => dropDown.navigatePrev(),
      home: () => dropDown.navigateFirst(),
      end: () => dropDown.navigateLast(),
      tab: () => dropDown.onItemActionKey(DropDownActionKey.TAB, event)
    };
    const action = actions[key];
    if (!action) {
      return;
    }
    if (key !== 'tab') {
      event.preventDefault();
      event.stopPropagation();
    }
    action();
  }

  protected onSelectionChanging(event: ISelectionEventArgs): void {
    const target: unknown = event.newSelection?.value;
    if (!isLocale(target) || target === this.i18n.locale()) {
      return;
    }
    this.analytics.track('select_language', { selected_language: target, previous_language: this.i18n.locale(), cta_location: 'navbar' });
    void this.router.navigateByUrl(switchLocaleUrl(this.router.url, target));
  }
}
