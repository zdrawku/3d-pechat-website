import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IGX_BUTTON_GROUP_DIRECTIVES, IGX_INPUT_GROUP_DIRECTIVES, IgxButtonDirective, IgxIconComponent } from 'igniteui-angular';

import { TranslatePipe } from '../../i18n/translate.pipe';
import type { ExpertOption } from '../engine/engine.types';

export type ExpertValues = Record<string, number | string>;

/**
 * The Studio's expert settings (variant 7), one control per `options().expert` entry:
 * a number field (unit as the suffix, the engine's limits and help) or a row of
 * buttons for a list. Only changed values are emitted, so the request carries
 * just what differs from the engine's defaults. Labels and help are the engine's
 * own (English): the Studio is for the shop, not for customers.
 */
@Component({
  selector: 'app-bookmark-expert-form',
  imports: [IGX_BUTTON_GROUP_DIRECTIVES, IGX_INPUT_GROUP_DIRECTIVES, IgxButtonDirective, IgxIconComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="expert-grid" data-testid="bookmark-expert-form">
      @for (option of options(); track option.key) {
        <div class="expert-item" [class.expert-item--list]="option.type === 'enum'" [class.is-changed]="option.key in values()">
          @if (option.type === 'enum') {
            <span class="expert-label">{{ option.label }}</span>
            <igx-buttongroup selectionMode="singleRequired" [attr.aria-label]="option.label" [attr.data-testid]="'expert-' + option.key">
              @for (choice of option.values ?? []; track choice.value) {
                <button igxButton type="button" [selected]="current(option) === choice.value" (click)="set(option, choice.value)">{{ choice.label }}</button>
              }
            </igx-buttongroup>
          } @else {
            <igx-input-group type="border">
              <input igxInput type="number" [attr.min]="option.min" [attr.max]="option.max" [attr.step]="option.step"
                     [value]="current(option)" (change)="setNumber(option, $event)" [attr.data-testid]="'expert-' + option.key" />
              <label igxLabel>{{ option.label }}</label>
              @if (option.unit) {
                <span igxSuffix>{{ option.unit }}</span>
              }
            </igx-input-group>
          }
          <span class="expert-help">{{ option.help }}</span>
        </div>
      }
    </div>
    <button igxButton="flat" type="button" class="expert-reset" [disabled]="!hasChanges()" (click)="valuesChange.emit({})"
            data-testid="bookmark-expert-reset">
      <igx-icon>restart_alt</igx-icon>
      {{ 'bookmarks.studio.expertReset' | t }}
    </button>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; gap: var(--space-3); }
    .expert-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: var(--space-3); }
    .expert-item { display: flex; flex-direction: column; gap: var(--space-1); min-width: 0; }
    /* A list's buttons need the full width: their labels („Exact (art in the filament colours)“) are long. */
    .expert-item--list { grid-column: 1 / -1; }
    .expert-item--list button[igxButton] { white-space: normal; height: auto; min-height: 30px; line-height: 1.25; }
    .expert-item.is-changed igx-input-group, .expert-item.is-changed igx-buttongroup { box-shadow: 0 0 0 2px var(--ig-primary-500); }
    .expert-label { font-size: 0.8125rem; font-weight: 600; color: var(--ig-gray-800); }
    .expert-help { font-size: 0.75rem; color: var(--ig-gray-700); }
    .expert-reset { align-self: flex-start; }
  `]
})
export class BookmarkExpertFormComponent {
  readonly options = input.required<readonly ExpertOption[]>();
  readonly values = input.required<ExpertValues>();
  readonly valuesChange = output<ExpertValues>();

  protected hasChanges(): boolean {
    return Object.keys(this.values()).length > 0;
  }

  protected current(option: ExpertOption): number | string {
    return this.values()[option.key] ?? option.default;
  }

  protected set(option: ExpertOption, value: number | string): void {
    const rest = { ...this.values() };
    delete rest[option.key];
    this.valuesChange.emit(value === option.default ? rest : { ...rest, [option.key]: value });
  }

  /** A typed number, kept within the engine's limits; an empty or invalid field goes back to the default. */
  protected setNumber(option: ExpertOption, event: Event): void {
    const field = event.target as HTMLInputElement;
    const typed = Number(field.value);
    if (field.value.trim() === '' || !Number.isFinite(typed)) {
      field.value = String(option.default);
      this.set(option, option.default);
      return;
    }
    const value = Math.min(option.max ?? typed, Math.max(option.min ?? typed, typed));
    field.value = String(value);
    this.set(option, value);
  }
}
