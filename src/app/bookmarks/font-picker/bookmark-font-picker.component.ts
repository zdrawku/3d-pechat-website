import { ChangeDetectionStrategy, Component, PLATFORM_ID, afterNextRender, computed, inject, input, output } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { IgxButtonDirective } from 'igniteui-angular';

import { I18nService } from '../../i18n/i18n.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import type { TranslationKey } from '../../i18n/i18n.types';
import type { FontOption } from '../engine/engine.types';
import { BOOKMARK_FONT_FACES } from './bookmark-fonts.generated';

/** Any Cyrillic letter: a font without Cyrillic can't print such a name. */
const CYRILLIC = /[Ѐ-ӿ]/;

/** The CSS family a font's sample is drawn in (prefixed, so it never clashes with the site's own fonts). */
export const sampleFamily = (id: string) => `bm-font-${id}`;

let registered = false;

/**
 * Registers the self-hosted web fonts once per page load. Only the declarations:
 * the browser downloads a file when text in its family and unicode range is drawn.
 */
function registerFontFaces(fonts: readonly FontOption[]): void {
  if (registered) {
    return;
  }
  registered = true;
  for (const face of BOOKMARK_FONT_FACES) {
    const font = fonts.find((f) => f.id === face.id);
    if (font) {
      const fontFace = new FontFace(sampleFamily(face.id), `url(assets/fonts/bookmarks/${face.file})`, {
        weight: String(font.weight),
        unicodeRange: face.unicodeRange,
        display: 'swap'
      });
      document.fonts.add(fontFace);
    }
  }
}

interface FontGroup {
  id: string;
  label: string;
  fonts: FontOption[];
}

/**
 * The name's font (variant 3A): every engine font, in the engine's groups and
 * order, each drawn with the customer's own name as the sample. A font without
 * Cyrillic is disabled while the name has Cyrillic letters; a font the engine
 * marks `print: 'check'` (thin strokes) is tagged „за кратки имена“.
 */
@Component({
  selector: 'app-bookmark-font-picker',
  imports: [IgxButtonDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="font-list" role="group" [attr.aria-label]="label()" data-testid="bookmark-font">
      @for (group of groups(); track group.id) {
        <span class="font-group">{{ group.label }}</span>
        @for (font of group.fonts; track font.id) {
          @let blocked = !font.cyrillic && cyrillicSample();
          <button igxButton="flat" type="button" class="font-option" [class.is-selected]="value() === font.id"
                  [attr.aria-pressed]="value() === font.id" [disabled]="blocked" (click)="valueChange.emit(font.id)"
                  [attr.data-testid]="'bookmark-font-' + font.id">
            <span class="font-sample" [style.font-family]="family(font.id)" [style.font-weight]="font.weight">
              {{ blocked ? font.label : sample() }}
            </span>
            @if (blocked) {
              <span class="font-note">{{ 'bookmarks.fonts.latinOnly' | t }}</span>
            } @else if (font.print === 'check') {
              <span class="font-tag">{{ 'bookmarks.fonts.short' | t }}</span>
            } @else {
              <span class="font-note">{{ font.label }}</span>
            }
          </button>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .font-list {
      display: flex; flex-direction: column; max-height: 17rem; overflow-y: auto;
      border: 1px solid var(--ig-gray-300); border-radius: var(--radius-sm); background: var(--bg-card);
    }
    .font-group {
      padding: var(--space-2) var(--space-3) var(--space-1); font-size: 0.6875rem; font-weight: 600;
      letter-spacing: 0.06em; text-transform: uppercase; color: var(--ig-gray-700);
    }
    .font-option.igx-button--flat {
      --ig-flat-button-foreground: var(--ig-gray-900);
      --ig-flat-button-hover-foreground: var(--ig-gray-900);
      --ig-flat-button-focus-foreground: var(--ig-gray-900);
      --ig-flat-button-focus-visible-foreground: var(--ig-gray-900);
      --ig-flat-button-active-foreground: var(--ig-gray-900);
      justify-content: space-between; gap: var(--space-3); width: 100%; height: auto; min-height: 2.5rem;
      padding: var(--space-1) var(--space-3); text-transform: none; letter-spacing: normal; border-radius: 0;
    }
    .font-option.is-selected { background: color-mix(in srgb, var(--ig-primary-500) 12%, transparent); box-shadow: inset 3px 0 0 var(--ig-primary-500); }
    .font-sample { font-size: 1.3rem; line-height: 1.3; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .font-note { flex-shrink: 0; font-size: 0.75rem; font-weight: 400; color: var(--ig-gray-700); }
    .font-tag {
      flex-shrink: 0; padding: 1px 6px; border-radius: var(--radius-sm); font-size: 0.6875rem; font-weight: 600;
      background: color-mix(in srgb, var(--ig-warn-500) 25%, transparent); color: var(--ig-gray-900);
    }
  `]
})
export class BookmarkFontPickerComponent {
  private readonly i18n = inject(I18nService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly fonts = input.required<readonly FontOption[]>();
  readonly value = input.required<string>();
  /** The name to draw each font with; empty = the translated example name. */
  readonly text = input('');
  readonly label = input('');
  readonly valueChange = output<string>();

  protected readonly sample = computed(() => this.text().trim() || this.i18n.t('bookmarks.fonts.sample'));
  protected readonly cyrillicSample = computed(() => CYRILLIC.test(this.sample()));

  /** The engine's groups in its own order, with translated labels (the engine's English one as the fallback). */
  protected readonly groups = computed<FontGroup[]>(() => {
    const groups: FontGroup[] = [];
    for (const font of this.fonts()) {
      let group = groups.find((g) => g.id === font.group);
      if (!group) {
        const key = `bookmarks.fonts.groups.${font.group}`;
        const text = this.i18n.t(key as TranslationKey);
        group = { id: font.group, label: text === key ? font.groupLabel : text, fonts: [] };
        groups.push(group);
      }
      group.fonts.push(font);
    }
    return groups;
  });

  constructor() {
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId) && typeof FontFace !== 'undefined') {
        registerFontFaces(this.fonts());
      }
    });
  }

  /** The sample's font stack: the self-hosted web font, then a neutral fallback while it loads. */
  protected family(id: string): string {
    return `"${sampleFamily(id)}", system-ui, sans-serif`;
  }
}
