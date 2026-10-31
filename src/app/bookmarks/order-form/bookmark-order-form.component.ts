import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, PLATFORM_ID, inject, input, signal, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IGX_CARD_DIRECTIVES, IGX_INPUT_GROUP_DIRECTIVES, IgxButtonDirective, IgxIconComponent } from 'igniteui-angular';

import { environment } from '../../../environments/environment';
import { BUSINESS } from '../../../data/business';
import { AnalyticsService } from '../../services/analytics.service';
import { I18nService } from '../../i18n/i18n.service';
import { LocalizePathPipe, TranslatePipe } from '../../i18n/translate.pipe';
import { HcaptchaApi, loadHcaptcha } from '../../shared/hcaptcha/hcaptcha-loader';
import type { BookmarkEngine, BookmarkRequest } from '../engine/engine.types';

/**
 * The Web3Forms field that carries the order recipe as minified JSON text. File
 * uploads are a Pro feature (refused on the free plan, 2026-10-31), so the recipe
 * travels in the email itself; the Studio's Orders tab takes it pasted back.
 */
export const ORDER_JSON_FIELD = 'order_json';

type OrderStatus = 'idle' | 'success' | 'error' | 'missing-fields' | 'missing-captcha' | 'need-picture' | 'too-big';

/**
 * The order form under the preview: the contact form's fields, validation and
 * hCaptcha, plus quantity and notes, sent through Web3Forms.
 *
 * No attachment: the order recipe from `engine.createOrder()` goes into the email
 * as minified JSON text (field `order_json`; ~0.5 KB for a pattern, ~60–80 KB with
 * pictures), and its plain-text summary is the email body, so the order reads
 * without the recipe. The site never assembles either. No print files are ever
 * offered here (customers don't get them).
 */
@Component({
  selector: 'app-bookmark-order-form',
  imports: [IGX_CARD_DIRECTIVES, IGX_INPUT_GROUP_DIRECTIVES, IgxButtonDirective, IgxIconComponent, FormsModule, RouterLink, TranslatePipe, LocalizePathPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bookmark-order-form.component.html',
  styleUrl: './bookmark-order-form.component.scss'
})
export class BookmarkOrderFormComponent implements OnDestroy {
  /** What the visitor designed, or null while it can't be ordered yet (a picture is still missing). */
  readonly request = input.required<BookmarkRequest | null>();
  readonly engine = input.required<BookmarkEngine | null>();
  /** `options().limits.orderMaxBytes` — the engine's 1 MB cap on the order recipe. */
  readonly orderMaxBytes = input.required<number>();

  protected name = '';
  protected email = '';
  protected phone = '';
  protected quantity = 1;
  protected notes = '';

  protected readonly status = signal<OrderStatus>('idle');
  protected readonly submitting = signal(false);

  protected readonly businessEmail = BUSINESS.email;
  protected readonly replyHours = BUSINESS.replyWithinHours;
  /** „3–7“ — the larger-pieces-and-series lead time in business.json (never typed into a translation). */
  protected readonly leadDays = BUSINESS.leadTimeWorkingDays.largeOrSeries;

  private readonly captchaHost = viewChild<ElementRef<HTMLElement>>('captcha');
  private readonly platformId = inject(PLATFORM_ID);
  private readonly i18n = inject(I18nService);
  private readonly analytics = inject(AnalyticsService);

  private hcaptcha?: HcaptchaApi;
  private widgetId?: string;
  private captchaToken = '';
  private captchaRequested = false;

  /** hCaptcha loads on the first interaction with the form, to stay off the page's load path. */
  protected onFormInteraction(): void {
    if (this.captchaRequested || !isPlatformBrowser(this.platformId)) {
      return;
    }
    this.captchaRequested = true;
    loadHcaptcha().then((api) => {
      const host = this.captchaHost()?.nativeElement;
      if (!host) {
        return;
      }
      this.hcaptcha = api;
      this.widgetId = api.render(host, {
        sitekey: environment.hcaptchaSiteKey,
        hl: this.i18n.locale(),
        callback: (token: string) => (this.captchaToken = token),
        'expired-callback': () => (this.captchaToken = ''),
        'error-callback': () => (this.captchaToken = '')
      });
    }).catch(() => {
      this.captchaRequested = false;
    });
  }

  ngOnDestroy(): void {
    this.resetCaptcha();
  }

  private resetCaptcha(): void {
    this.captchaToken = '';
    if (this.hcaptcha && this.widgetId !== undefined) {
      this.hcaptcha.reset(this.widgetId);
    }
  }

  protected async submit(): Promise<void> {
    const request = this.request();
    const engine = this.engine();
    if (!request || !engine) {
      this.status.set('need-picture');
      return;
    }
    const quantity = Math.floor(Number(this.quantity));
    if (!this.name.trim() || !this.email.trim() || !this.phone.trim() || !(quantity >= 1)) {
      this.status.set('missing-fields');
      return;
    }
    if (!this.captchaToken) {
      this.status.set('missing-captcha');
      return;
    }

    this.submitting.set(true);
    this.status.set('idle');
    try {
      const order = await engine.createOrder(request, {
        name: this.name.trim(),
        email: this.email.trim(),
        phone: this.phone.trim(),
        quantity,
        notes: this.notes.trim(),
        locale: this.i18n.locale()
      }, { container: 'json' });
      // The engine's own limit; the recipe is sent as text, never as a file.
      if (order.bytes > this.orderMaxBytes()) {
        this.status.set('too-big');
        return;
      }

      const formData = new FormData();
      formData.append('access_key', environment.web3formsAccessKey);
      formData.append('name', this.name.trim());
      formData.append('email', this.email.trim());
      formData.append('phone', this.phone.trim());
      formData.append('subject', this.i18n.t('bookmarks.order.subject', { id: order.id }));
      formData.append('message', order.summary);
      formData.append('from_name', this.i18n.t('bookmarks.order.fromName'));
      formData.append('h-captcha-response', this.captchaToken);
      formData.append(ORDER_JSON_FIELD, JSON.stringify(JSON.parse(await order.file.text())));

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData
      });
      const result = await response.json();
      if (result.success) {
        this.analytics.track('generate_lead', { lead_source: 'bookmark_order' });
        this.status.set('success');
        this.name = this.email = this.phone = this.notes = '';
        this.quantity = 1;
      } else {
        // Web3Forms says why (a refused field included): keep it for whoever debugs the order.
        console.error('Web3Forms refused the bookmark order:', result.message);
        this.status.set('error');
      }
    } catch {
      this.status.set('error');
    } finally {
      this.submitting.set(false);
      this.resetCaptcha();
    }
  }
}
