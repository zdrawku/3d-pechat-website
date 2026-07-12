import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { IGX_INPUT_GROUP_DIRECTIVES, IgxButtonDirective, IgxIconComponent, IgxTooltipDirective, IgxTooltipTargetDirective } from 'igniteui-angular';
import { SeoService } from '../services/seo.service';
import { environment } from '../../environments/environment';

declare const hcaptcha: {
  render(container: string | HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
};

const HCAPTCHA_CALLBACK = 'onHcaptchaLoad';

@Component({
  selector: 'app-contact-me-page',
  imports: [IGX_INPUT_GROUP_DIRECTIVES, IgxButtonDirective, IgxIconComponent, IgxTooltipDirective, IgxTooltipTargetDirective, FormsModule],
  templateUrl: './contact-me-page.component.html',
  styleUrls: ['./contact-me-page.component.scss']
})

export class ContactMePageComponent implements OnInit, OnDestroy {
  public value?: string;
  public value1?: string;
  public value2?: string;
  public message?: string;

  public isSubmitting = false;
  public submitStatus: 'idle' | 'success' | 'error' | 'missing-fields' | 'missing-captcha' | 'invalid-file' = 'idle';

  // Attached image (optional, single file only). Web3Forms accepts file
  // attachments via multipart/form-data — see
  // https://docs.web3forms.com/getting-started/examples/file-upload-form
  // NOTE: multiple attachments require a paid Web3Forms plan; the free tier
  // only delivers one, so the UI is deliberately limited to a single file
  // (with an inline notice) rather than silently dropping extras.
  public attachedFile: File | null = null;
  // Web3Forms rejects (400) attachments over 1 MB — see
  // https://docs.web3forms.com/getting-started/examples/file-upload-form
  private readonly maxFileSizeBytes = 1 * 1024 * 1024; // 1 MB

  private hcaptchaWidgetId?: string;
  private hcaptchaToken = '';

  phoneNumber = '+359883310616';
  email = '3dpechat.bg@gmail.com';
  instagramUrl = 'https://www.instagram.com/3dpechat.bg';
  tiktokUrl = 'https://www.tiktok.com/@3dpechat.bg';

  constructor(private router: Router, private seoService: SeoService) {
    this.seoService.updateSeo({
      title: 'Контакти - 3D Печат България',
      description: 'Свържете се с нас за 3D печат услуги. Телефон, имейл, Viber, Instagram и TikTok. Бързо и лесно поръчайте вашия 3D принтиран продукт.',
      keywords: '3D печат контакти, поръчка 3D печат, 3D принтиране поръчка, свържете се с нас',
      url: 'https://3dpechat.bg/contact/',
      type: 'website'
    });
    this.seoService.removeStructuredData();
    // Check if navigation state contains prefilled message
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const state = navigation.extras.state;
      if (state['prefilledMessage']) {
        this.message = state['prefilledMessage'];
      }
      if (state['productName']) {
        this.value2 = `Поръчка за ${state['productName']}`;
      }
    }
  }

  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    // history/hCaptcha are browser-only — skip during prerendering
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    // Also check for state from history in case component is already initialized
    const state = history.state;
    if (state && state['prefilledMessage'] && !this.message) {
      this.message = state['prefilledMessage'];
    }
    if (state && state['productName'] && !this.value2) {
      this.value2 = `Поръчка за ${state['productName']}`;
    }
    // hCaptcha (~1.3 MB incl. worker) is loaded lazily on first form
    // interaction — see onFormInteraction() — to keep it off the LCP path.
  }

  private hcaptchaRequested = false;

  onFormInteraction(): void {
    if (this.hcaptchaRequested || !isPlatformBrowser(this.platformId)) {
      return;
    }
    this.hcaptchaRequested = true;
    this.loadHcaptcha();
  }

  private loadHcaptcha(): void {
    if (typeof hcaptcha !== 'undefined') {
      this.renderHcaptcha();
      return;
    }

    (window as unknown as Record<string, unknown>)[HCAPTCHA_CALLBACK] = () => this.renderHcaptcha();

    const script = document.createElement('script');
    script.src = `https://js.hcaptcha.com/1/api.js?onload=${HCAPTCHA_CALLBACK}&render=explicit`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  private renderHcaptcha(): void {
    this.hcaptchaWidgetId = hcaptcha.render('hcaptcha-container', {
      sitekey: environment.hcaptchaSiteKey,
      callback: (token: string) => this.hcaptchaToken = token,
      'expired-callback': () => this.hcaptchaToken = '',
      'error-callback': () => this.hcaptchaToken = ''
    });
  }

  private resetHcaptcha(): void {
    this.hcaptchaToken = '';
    if (this.hcaptchaWidgetId !== undefined) {
      hcaptcha.reset(this.hcaptchaWidgetId);
    }
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.resetHcaptcha();
    delete (window as unknown as Record<string, unknown>)[HCAPTCHA_CALLBACK];
  }

  openViber(): void {
    const viberUrl = `viber://add?number=${this.phoneNumber}`;
    window.location.href = viberUrl;
  }

  openInstagram(): void {
    window.open(this.instagramUrl, '_blank');
  }

  openTikTok(): void {
    window.open(this.tiktokUrl, '_blank');
  }

  // Called by the hidden <input type="file"> in the template (see .file-dropzone
  // in the HTML). Only a single file is accepted — the free Web3Forms plan
  // only delivers one attachment, so the input doesn't even have `multiple`.
  // Validates size before setting attachedFile, which the template renders as
  // a removable chip (.file-chip / removeFile()).
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    // Size limit (maxFileSizeBytes above).
    if (file.size > this.maxFileSizeBytes) {
      this.submitStatus = 'invalid-file';
      input.value = '';
      return;
    }

    this.attachedFile = file;
    if (this.submitStatus === 'invalid-file') {
      this.submitStatus = 'idle';
    }
    // Clear the input value so re-selecting the same filename fires 'change' again.
    input.value = '';
  }

  // Removes the attached file (X button on the .file-chip).
  removeFile(): void {
    this.attachedFile = null;
  }

  async sendEmail(form: NgForm): Promise<void> {
    // Validate required fields
    if (!this.value || !this.value1 || !this.value2 || !this.message) {
      this.submitStatus = 'missing-fields';
      return;
    }

    if (!this.hcaptchaToken) {
      this.submitStatus = 'missing-captcha';
      return;
    }

    this.isSubmitting = true;
    this.submitStatus = 'idle';

    try {
      // FormData (multipart) instead of JSON so a file attachment is supported
      // — Web3Forms reads a field as a file attachment when its value is a
      // File/Blob. Single file only (see attachedFile above).
      const formData = new FormData();
      formData.append('access_key', environment.web3formsAccessKey);
      formData.append('name', this.value);
      formData.append('email', this.value1);
      formData.append('subject', this.value2);
      formData.append('message', this.message);
      formData.append('from_name', '3dpechat.bg контактна форма');
      formData.append('h-captcha-response', this.hcaptchaToken);
      // File attachment disabled: Web3Forms file upload is a Pro-plan
      // feature, not available on the current plan.
      // if (this.attachedFile) {
      //   formData.append('attachment', this.attachedFile, this.attachedFile.name);
      // }

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        this.submitStatus = 'success';
        form.resetForm();
        this.attachedFile = null;
      } else {
        this.submitStatus = 'error';
      }
    } catch {
      this.submitStatus = 'error';
    } finally {
      this.isSubmitting = false;
      this.resetHcaptcha();
    }
  }
}
