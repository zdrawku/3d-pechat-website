import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IGX_INPUT_GROUP_DIRECTIVES, IgxButtonDirective, IgxIconComponent, IgxTooltipDirective, IgxTooltipTargetDirective } from 'igniteui-angular';
import { SeoService } from '../services/seo.service';

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

  ngOnInit(): void {
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

  sendEmail(): void {
    // Validate required fields
    if (!this.value || !this.value1 || !this.value2 || !this.message) {
      alert('Моля, попълнете всички полета');
      return;
    }

    // Construct the email
    const to = this.email;
    const subject = encodeURIComponent(this.value2);
    const body = encodeURIComponent(
      `Име: ${this.value}\n` +
      `Email: ${this.value1}\n\n` +
      `Съобщение:\n${this.message}`
    );

    // Open email client
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  }
}
