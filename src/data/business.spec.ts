import { TestBed } from '@angular/core/testing';

import { BUSINESS, formatPhone } from './business';
import { I18nService } from '../app/i18n/i18n.service';
import { openingHoursText } from '../app/i18n/business-copy';

describe('business data', () => {
  // Opening hours as text (every language, partial weeks) are formatted by
  // src/app/i18n/business-copy.ts — see business-copy.spec.ts.
  it('formats the phone the way the site prints it', () => {
    expect(formatPhone()).toBe('+359 883 310 616');
  });

  it('keeps the identity the map listing uses', () => {
    expect(BUSINESS.name).toBe('3dpechat');
    expect(BUSINESS.technologies).toEqual(['FDM']);
    expect(BUSINESS.displayAddress).toContain('1700 София');
  });

  // The structured numbers (read by the calculator and every language's pages) and
  // the Bulgarian prose facts (read by the FAQ, llms.txt and the blog prompt)
  // must say the same thing.
  it('states every structured number in the prose facts too', () => {
    const facts = BUSINESS.facts.join(' ');
    const bg = (n: number) => n.toFixed(2).replace('.', ',');
    for (const price of BUSINESS.pricing.perTenGrams) {
      expect(facts).withContext(`price ${price}`).toContain(bg(price));
    }
    expect(facts).toContain(`Минималната стойност на поръчка е ${BUSINESS.pricing.minimumOrder} €`);
    expect(facts).toContain(`малки детайли – ${BUSINESS.leadTimeWorkingDays.small} работни дни`);
    expect(facts).toContain(`малки серии – ${BUSINESS.leadTimeWorkingDays.largeOrSeries} работни дни`);
    expect(facts).toContain(`${BUSINESS.rushSurchargePercent}% надценка`);
    expect(facts).toContain(`до ${BUSINESS.maxPieceCm} × ${BUSINESS.maxPieceCm} × ${BUSINESS.maxPieceCm} см`);
    expect(facts).toContain(`безплатна в цялата страна за поръчки над ${BUSINESS.freeDeliveryOverEur} €`);
    // The hours exactly as the contact page renders them in Bulgarian.
    expect(facts).toContain(openingHoursText(TestBed.inject(I18nService)));
    expect(facts).toContain(`до ${BUSINESS.replyWithinHours} часа`);
    for (const format of BUSINESS.fileFormats) {
      expect(facts).withContext(format).toContain(format);
    }
    // languages: ["bg", "en"] ⇔ the prose promises replies in both.
    expect(BUSINESS.languages).toEqual(['bg', 'en']);
    expect(facts).toContain('на български и на английски');
  });
});
