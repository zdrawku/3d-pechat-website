import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { IgxButtonDirective, IgxIconButtonDirective, IgxIconComponent } from 'igniteui-angular';

import { I18nService } from '../../i18n/i18n.service';
import { TranslatePipe } from '../../i18n/translate.pipe';

/** Floating-point steps (0.5 mm) drift; values are kept to this many decimals. */
const DECIMALS = 2;
const round = (n: number) => Math.round(n * 10 ** DECIMALS) / 10 ** DECIMALS;

/**
 * A number in millimetres, changed with − / + in the engine's own steps, never typed
 * (variant 5A). With `autoLabel`, `null` means "let the engine choose": − and + start
 * from the largest value, and an „Авто“ button goes back to it.
 */
@Component({
  selector: 'app-bookmark-stepper',
  imports: [IgxButtonDirective, IgxIconButtonDirective, IgxIconComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stepper" role="group" [attr.aria-label]="label()" [attr.data-testid]="testid()">
      <button igxIconButton="outlined" type="button" [disabled]="!canDecrease()" (click)="move(-1)"
              [attr.aria-label]="'bookmarks.stepper.decrease' | t: { what: label() }" data-testid="stepper-decrease">
        <igx-icon>remove</igx-icon>
      </button>
      <span class="stepper-value" aria-live="polite" data-testid="stepper-value">{{ text() }}</span>
      <button igxIconButton="outlined" type="button" [disabled]="!canIncrease()" (click)="move(1)"
              [attr.aria-label]="'bookmarks.stepper.increase' | t: { what: label() }" data-testid="stepper-increase">
        <igx-icon>add</igx-icon>
      </button>
      @if (autoLabel() && value() !== null) {
        <button igxButton="flat" type="button" class="stepper-auto" (click)="valueChange.emit(null)" data-testid="stepper-auto">
          {{ autoLabel() }}
        </button>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .stepper { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
    .stepper-value {
      min-width: 4.5rem; padding: var(--space-1) var(--space-2); text-align: center; font-variant-numeric: tabular-nums;
      border: 1px solid var(--ig-gray-400); border-radius: var(--radius-sm); background: var(--bg-card);
    }
    .igx-icon-button--outlined {
      --ig-icon-button-foreground: var(--ig-gray-900);
      --ig-icon-button-border-color: var(--ig-gray-400);
      --ig-icon-button-hover-foreground: var(--ig-gray-900);
      --ig-icon-button-focus-foreground: var(--ig-gray-900);
      --ig-icon-button-focus-border-color: var(--ig-primary-500);
    }
    .stepper-auto { text-transform: none; }
  `]
})
export class BookmarkStepperComponent {
  private readonly i18n = inject(I18nService);

  readonly value = input.required<number | null>();
  readonly min = input.required<number>();
  readonly max = input.required<number>();
  readonly step = input.required<number>();
  readonly label = input('');
  /** Shown for `null`; leave empty when the value always has a number. */
  readonly autoLabel = input('');
  /** Shown for 0, e.g. „Без рамка“; empty = "0 мм". */
  readonly zeroLabel = input('');
  readonly testid = input('');
  readonly valueChange = output<number | null>();

  protected readonly text = computed(() => {
    const value = this.value();
    if (value === null) {
      return this.autoLabel();
    }
    if (value === 0 && this.zeroLabel()) {
      return this.zeroLabel();
    }
    return this.i18n.t('bookmarks.units.mm', { n: this.i18n.formatNumber(value) });
  });
  protected readonly canDecrease = computed(() => (this.value() ?? this.max() + this.step()) > this.min());
  protected readonly canIncrease = computed(() => this.value() !== null && this.value()! < this.max());

  protected move(direction: 1 | -1): void {
    // From „Авто“, − starts one step below the largest value and + at the largest.
    const from = this.value() ?? (direction < 0 ? this.max() : this.max() - this.step());
    const next = round(Math.min(this.max(), Math.max(this.min(), from + direction * this.step())));
    this.valueChange.emit(next);
  }
}
