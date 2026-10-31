import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject, input, output } from '@angular/core';

import type { Hex } from '../engine/engine.types';

/**
 * Ignite UI Web Components' `igc-color-picker`: the one component here that is
 * not Ignite UI for Angular, because Angular's package has no colour picker
 * (CLAUDE.md Rule 1 exception). Only that one component is registered, and only
 * in the browser, from this lazy chunk — never during prerender.
 *
 * Theming: no global theme stylesheet is loaded (its `:root` palette would
 * overwrite the site's own `--ig-*` variables, which have the same names).
 * `configureTheme` selects the Material look and the picker reads the site's
 * variables; it follows the site's light/dark switch (`html.dark-theme`).
 */
let registered: Promise<typeof import('igniteui-webcomponents')> | undefined;

function registerColourPicker(): Promise<typeof import('igniteui-webcomponents')> {
  registered ??= import('igniteui-webcomponents').then((wc) => {
    wc.defineComponents(wc.IgcColorPickerComponent);
    return wc;
  });
  return registered;
}

const isDark = (): boolean => document.documentElement.classList.contains('dark-theme');

@Component({
  selector: 'app-bookmark-colour-picker',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <igc-color-picker
      class="bookmark-colour-picker"
      [attr.label]="label()"
      [value]="value()"
      hide-formats
      (igcInput)="onInput($event)"
      (igcChange)="onInput($event)"></igc-color-picker>
  `,
  styles: [`
    :host { display: block; }
    igc-color-picker {
      --ig-size: 2;
      font-family: inherit;
    }
  `]
})
export class BookmarkColourPickerComponent {
  readonly label = input.required<string>();
  readonly value = input.required<Hex>();
  readonly valueChange = output<Hex>();

  constructor() {
    let observer: MutationObserver | undefined;
    let destroyed = false;
    // Registered up front: the import below resolves later, and by then the view may be gone.
    inject(DestroyRef).onDestroy(() => {
      destroyed = true;
      observer?.disconnect();
    });
    afterNextRender(() => {
      registerColourPicker().then((wc) => {
        if (destroyed) {
          return;
        }
        wc.configureTheme('material', isDark() ? 'dark' : 'light');
        // The site's theme switch only toggles a class on <html>; tell the picker.
        observer = new MutationObserver(() => wc.configureTheme('material', isDark() ? 'dark' : 'light'));
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      });
    });
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (/^#[0-9a-f]{6}$/i.test(value)) {
      this.valueChange.emit(value.toLowerCase() as Hex);
    }
  }
}
