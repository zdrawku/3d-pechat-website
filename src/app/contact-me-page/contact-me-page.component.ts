import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { IGX_INPUT_GROUP_DIRECTIVES, IgxButtonDirective, IgxIconComponent, IgxTooltipDirective, IgxTooltipTargetDirective } from 'igniteui-angular';
import { SeoService } from '../services/seo.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-contact-me-page',
  imports: [IGX_INPUT_GROUP_DIRECTIVES, IgxButtonDirective, IgxIconComponent, IgxTooltipDirective, IgxTooltipTargetDirective, FormsModule],
  templateUrl: './contact-me-page.component.html',
  styleUrls: ['./contact-me-page.component.scss']
})

export class ContactMePageComponent implements OnInit {
  public value?: string;
  public value1?: string;
  public value2?: string;
  public message?: string;

  public isSubmitting = false;
  public submitStatus: 'idle' | 'success' | 'error' | 'missing-fields' = 'idle';

  phoneNumber = '+359883310616';
  email = '3dpechat.bg@gmail.com';
  instagramUrl = 'https://www.instagram.com/3dpechat.bg';
  tiktokUrl = 'https://www.tiktok.com/@3dpechat.bg';

  constructor(private router: Router, private seoService: SeoService) {
    this.seoService.updateSeo({
      title: 'Контакти - 3D Печат България',
      description: 'Свържете се с нас за 3D печат услуги. Телефон, имейл, Viber, Instagram и TikTok. Бързо и лесно поръчайте вашия 3D принтиран продукт.',
      keywords: '3D печат контакти, поръчка 3D печат, 3D принтиране поръчка, свържете се с нас',
      url: 'https://3dpechat.bg/contact',
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
    // history is browser-only — skip during prerendering
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

  async sendEmail(form: NgForm): Promise<void> {
    // Validate required fields
    if (!this.value || !this.value1 || !this.value2 || !this.message) {
      this.submitStatus = 'missing-fields';
      return;
    }

    this.isSubmitting = true;
    this.submitStatus = 'idle';

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: environment.web3formsAccessKey,
          name: this.value,
          email: this.value1,
          subject: this.value2,
          message: this.message,
          from_name: '3dpechat.bg контактна форма'
        })
      });

      const result = await response.json();
      if (result.success) {
        this.submitStatus = 'success';
        form.resetForm();
      } else {
        this.submitStatus = 'error';
      }
    } catch {
      this.submitStatus = 'error';
    } finally {
      this.isSubmitting = false;
    }
  }
}
