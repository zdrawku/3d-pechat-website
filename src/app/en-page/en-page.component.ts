import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IGX_CARD_DIRECTIVES, IgxAvatarComponent, IgxButtonDirective, IgxIconComponent } from 'igniteui-angular';

import { HOME_LANGUAGE_ALTERNATES, SITE_ORIGIN, SeoService } from '../services/seo.service';
import { BUSINESS, formatPhone, openingHoursLabelEn, priceRangeEn } from '../../data/business';

const URL = `${SITE_ORIGIN}/en/`;
const TITLE = 'Custom 3D Printing in Sofia, Bulgaria | 3dpechat.bg';

const { pricing, leadTimeWorkingDays: lead, rushSurchargePercent: rush, maxPieceCm: max } = BUSINESS;
const minPerTen = Math.min(...pricing.perTenGrams).toFixed(2);

/**
 * The one English page (AI-VISIBILITY-PLAN.md Phase 5, design variant A): a
 * landing for English questions such as "3D printing service Sofia". Not full
 * i18n — the rest of the site stays Bulgarian. Every number and contact detail
 * comes from src/data/business.json (CLAUDE.md Rule 5), so it can't drift from
 * the Bulgarian pages; the prose is a translation of business.json `facts`.
 */
@Component({
  selector: 'app-en-page',
  imports: [IGX_CARD_DIRECTIVES, IgxAvatarComponent, IgxButtonDirective, IgxIconComponent, RouterLink],
  templateUrl: './en-page.component.html',
  styleUrls: ['./en-page.component.scss']
})
export class EnPageComponent {
  readonly services = [
    { icon: 'view_in_ar', title: 'Prototypes', text: 'Test a shape, a fit or a mechanism before you commit to production.' },
    { icon: 'build', title: 'Functional and replacement parts', text: 'Brackets, holders, clips and spare parts that are no longer sold.' },
    { icon: 'layers', title: 'Small batches', text: 'From a few pieces to a small series, for shops, makers and companies.' },
    { icon: 'redeem', title: 'Personalised gifts', text: 'Gifts, decorations and collectibles printed to your design.' }
  ];

  readonly steps = [
    { title: 'Send your idea', text: `A 3D model (${BUSINESS.fileFormats.join(', ').replace(/, (?=[^,]+$)/, ' or ')}), a sketch, a photo or a description – by email or Viber.` },
    { title: 'Get a free quote', text: `We usually reply within ${BUSINESS.replyWithinHours} hours, in English or Bulgarian. The first quote is free; the price of modelling depends on its complexity – the time it takes – and you know it from the quote before we start.` },
    { title: 'We print', text: `FDM printing, mainly in PLA. Small items take ${lead.small} working days, larger items and small batches ${lead.largeOrSeries}. Rush orders are possible when the queue allows, for +${rush}%.` },
    { title: 'Pick-up or delivery', text: `In Sofia in person or by city courier, by arrangement. Anywhere else in Bulgaria by Econt or Speedy – free for orders over €${BUSINESS.freeDeliveryOverEur}.` }
  ];

  readonly priceLines = [
    `Priced by weight: ${priceRangeEn()} per 10 g, depending on the tier.`,
    `Minimum order: €${pricing.minimumOrder}.`,
    `Up to ${max} × ${max} × ${max} cm in one piece; larger items are printed in parts and glued.`,
    'FDM printing. PLA is in stock in standard colours; PETG, TPU and other materials are bought for your order.'
  ];

  readonly deliveryLines = [
    'Sofia: in person or by city courier, arranged by phone or message.',
    'Rest of Bulgaria: Econt or Speedy to an office, an address or a parcel locker, with cash on delivery.',
    `Delivery is free anywhere in Bulgaria for orders over €${BUSINESS.freeDeliveryOverEur}; below that it costs the courier’s rate.`,
    'Payment: cash on pick-up, Revolut transfer or cash on delivery.',
    'We don’t issue invoices at the moment.'
  ];

  readonly replyHours = BUSINESS.replyWithinHours;
  readonly address = BUSINESS.displayAddressEn;
  readonly mapUrl = BUSINESS.hasMap;
  readonly hours = openingHoursLabelEn();
  readonly phone = formatPhone();
  readonly email = BUSINESS.email;

  constructor(seo: SeoService) {
    seo.updateSeo({
      title: TITLE,
      description: `Custom FDM 3D printing in Sofia: prototypes, spare parts, small batches and gifts. From €${minPerTen} per 10 g, ${lead.small} working days, delivery across Bulgaria.`,
      keywords: '3D printing Sofia, 3D printing service Bulgaria, custom 3D printing, FDM 3D printing, PLA printing, prototypes, spare parts, small batch printing',
      url: URL,
      type: 'website',
      locale: 'en',
      alternates: HOME_LANGUAGE_ALTERNATES
    });
    seo.setStructuredData({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${URL}#webpage`,
      url: URL,
      name: TITLE,
      inLanguage: 'en',
      about: { '@id': `${SITE_ORIGIN}/#organization` }
    });
  }
}
