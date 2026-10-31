import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { IGX_BUTTON_GROUP_DIRECTIVES, IGX_CARD_DIRECTIVES, IGX_INPUT_GROUP_DIRECTIVES, IgxButtonDirective, IgxIconComponent } from 'igniteui-angular';

import { TranslatePipe } from '../../i18n/translate.pipe';
import { BOOKMARK_ENGINE, BOOKMARK_PRINT } from '../engine/engine.token';
import type { BookmarkRequest, BuildOptions, Customer } from '../engine/engine.types';

/** The nozzles `print.build` takes (`BuildOptions.nozzle`). */
const NOZZLES: readonly NonNullable<BuildOptions['nozzle']>[] = [0.4, 0.2];

interface OpenedOrder {
  id: string;
  customer: Customer;
  request: BookmarkRequest;
  previewUrl: string;
  files: { name: string; url: string }[];
}

/**
 * The Studio's Orders tab: paste the order JSON from the email (the order form
 * sends it as text — Web3Forms' free plan takes no files) or open a saved
 * `bookmark-order-<id>.json` / `.zip`, see the customer, the settings and the preview redrawn from the recipe,
 * then Build and download. Everything comes from the engine — the site only
 * shows it. With the stub engine (W1) opening fails with the engine's own message.
 */
@Component({
  selector: 'app-studio-orders',
  imports: [IGX_BUTTON_GROUP_DIRECTIVES, IGX_CARD_DIRECTIVES, IGX_INPUT_GROUP_DIRECTIVES, IgxButtonDirective, IgxIconComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <igx-card class="orders-card" data-testid="studio-orders">
      <igx-card-content>
        <igx-input-group type="border">
          <label igxLabel for="studio-order-json">{{ 'bookmarks.studio.pasteOrder' | t }}</label>
          <textarea igxInput #pasted id="studio-order-json" rows="4" spellcheck="false" data-testid="studio-order-json"></textarea>
        </igx-input-group>
        <div class="orders-actions">
          <button igxButton="contained" type="button" (click)="openPasted(pasted)" data-testid="studio-open-pasted">
            <igx-icon>assignment</igx-icon>
            {{ 'bookmarks.studio.openPasted' | t }}
          </button>
          <input #file type="file" hidden accept=".json,.zip,application/json,application/zip" (change)="openFile($event)" />
          <button igxButton="outlined" type="button" (click)="file.click()" data-testid="studio-open-order">
            <igx-icon>folder_open</igx-icon>
            {{ 'bookmarks.studio.openOrder' | t }}
          </button>
        </div>

        @if (error(); as message) {
          <p class="orders-problem" role="alert">{{ 'bookmarks.studio.orderError' | t: { message: message } }}</p>
        }

        @if (order(); as opened) {
          <dl class="orders-facts">
            <dt>{{ 'bookmarks.studio.orderId' | t }}</dt><dd>{{ opened.id }}</dd>
            <dt>{{ 'bookmarks.studio.orderCustomer' | t }}</dt>
            <dd>{{ opened.customer.name }}, {{ opened.customer.email }}, {{ opened.customer.phone }} ({{ opened.customer.quantity }})</dd>
          </dl>
          @if (opened.customer.notes) {
            <p>{{ opened.customer.notes }}</p>
          }
          <img [src]="opened.previewUrl" [alt]="'bookmarks.design.previewAlt' | t" class="orders-preview" />
          <span class="orders-label">{{ 'bookmarks.studio.nozzle' | t }}</span>
          <igx-buttongroup selectionMode="singleRequired" [attr.aria-label]="'bookmarks.studio.nozzle' | t" data-testid="studio-nozzle">
            @for (option of nozzles; track option) {
              <button igxButton type="button" [selected]="nozzle() === option" (click)="nozzle.set(option)">{{ option }} mm</button>
            }
          </igx-buttongroup>
          <button igxButton="outlined" type="button" (click)="build()" [disabled]="building()">
            <igx-icon>download</igx-icon>
            {{ 'bookmarks.studio.download' | t }}
          </button>
          @for (built of opened.files; track built.name) {
            <a igxButton="flat" [href]="built.url" [attr.download]="built.name">{{ built.name }}</a>
          }
        } @else if (!error()) {
          <p class="orders-empty">{{ 'bookmarks.studio.ordersEmpty' | t }}</p>
        }
      </igx-card-content>
    </igx-card>
  `,
  styles: [`
    :host { display: block; }
    .orders-card { width: 100%; max-width: none; margin: 0; }
    igx-card-content { display: flex; flex-direction: column; gap: var(--space-3); }
    .orders-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .orders-empty, .orders-facts, p { margin: 0; }
    .orders-facts { display: grid; grid-template-columns: max-content 1fr; gap: var(--space-1) var(--space-3); }
    .orders-facts dd { margin: 0; overflow-wrap: anywhere; }
    .orders-problem { color: #b71c1c; }
    .orders-label { font-size: 0.8125rem; font-weight: 600; }
    igx-buttongroup { align-self: flex-start; }
    .orders-preview { max-height: 320px; width: auto; max-width: 100%; align-self: flex-start; }
  `]
})
export class StudioOrdersComponent {
  private readonly startEngine = inject(BOOKMARK_ENGINE);
  private readonly startPrint = inject(BOOKMARK_PRINT);

  protected readonly order = signal<OpenedOrder | null>(null);
  protected readonly error = signal('');
  protected readonly building = signal(false);
  protected readonly nozzles = NOZZLES;
  protected readonly nozzle = signal<NonNullable<BuildOptions['nozzle']>>(0.4);

  protected openFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) {
      void this.open(file);
    }
  }

  /** The `order_json` text copied from the order email, read as the same recipe file. */
  protected openPasted(textarea: HTMLTextAreaElement): void {
    const text = textarea.value.trim();
    if (text) {
      void this.open(new Blob([text], { type: 'application/json' }));
    }
  }

  private async open(file: Blob): Promise<void> {
    this.error.set('');
    this.revoke();
    try {
      const engine = await this.startEngine();
      const { customer, request, id } = await engine.readOrder(file);
      const { png } = await engine.preview(request);
      const previewUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(png);
      });
      this.order.set({ id, customer, request, previewUrl, files: [] });
    } catch (e) {
      this.order.set(null);
      this.error.set(e instanceof Error ? e.message : String(e));
    }
  }

  protected async build(): Promise<void> {
    const opened = this.order();
    if (!opened) {
      return;
    }
    this.building.set(true);
    this.error.set('');
    try {
      const print = await this.startPrint();
      const built = await print.build(opened.request, { nozzle: this.nozzle() });
      const files = [{ name: built.threeMfName, file: built.threeMf }, ...built.stls, { name: 'bookmark.zip', file: built.zip }];
      this.order.set({ ...opened, files: files.map(({ name, file }) => ({ name, url: URL.createObjectURL(file) })) });
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.building.set(false);
    }
  }

  private revoke(): void {
    for (const { url } of this.order()?.files ?? []) {
      URL.revokeObjectURL(url);
    }
  }
}
