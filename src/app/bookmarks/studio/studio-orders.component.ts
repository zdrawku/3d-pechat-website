import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { IGX_CARD_DIRECTIVES, IgxButtonDirective, IgxIconComponent } from 'igniteui-angular';

import { TranslatePipe } from '../../i18n/translate.pipe';
import { BOOKMARK_ENGINE, BOOKMARK_PRINT } from '../engine/engine.token';
import type { BookmarkRequest, Customer } from '../engine/engine.types';

interface OpenedOrder {
  id: string;
  customer: Customer;
  request: BookmarkRequest;
  previewUrl: string;
  files: { name: string; url: string }[];
}

/**
 * The Studio's Orders tab: open a `bookmark-order-<id>.json` (or `.zip`) from the
 * email, see the customer, the settings and the preview redrawn from the recipe,
 * then Build and download. Everything comes from the engine — the site only
 * shows it. With the stub engine (W1) opening fails with the engine's own message.
 */
@Component({
  selector: 'app-studio-orders',
  imports: [IGX_CARD_DIRECTIVES, IgxButtonDirective, IgxIconComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <igx-card class="orders-card" data-testid="studio-orders">
      <igx-card-content>
        <input #file type="file" hidden accept=".json,.zip,application/json,application/zip" (change)="open($event)" />
        <button igxButton="contained" type="button" class="orders-open" (click)="file.click()" data-testid="studio-open-order">
          <igx-icon>folder_open</igx-icon>
          {{ 'bookmarks.studio.openOrder' | t }}
        </button>

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
    .orders-open { align-self: flex-start; }
    .orders-empty, .orders-facts, p { margin: 0; }
    .orders-facts { display: grid; grid-template-columns: max-content 1fr; gap: var(--space-1) var(--space-3); }
    .orders-facts dd { margin: 0; overflow-wrap: anywhere; }
    .orders-problem { color: #b71c1c; }
    .orders-preview { max-height: 320px; width: auto; max-width: 100%; align-self: flex-start; }
  `]
})
export class StudioOrdersComponent {
  private readonly startEngine = inject(BOOKMARK_ENGINE);
  private readonly startPrint = inject(BOOKMARK_PRINT);

  protected readonly order = signal<OpenedOrder | null>(null);
  protected readonly error = signal('');
  protected readonly building = signal(false);

  protected async open(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
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
      const built = await print.build(opened.request);
      const files = [{ name: 'bookmark.3mf', file: built.threeMf }, ...built.stls, { name: 'bookmark.zip', file: built.zip }];
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
