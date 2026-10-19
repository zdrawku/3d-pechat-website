import { TestBed } from '@angular/core/testing';

import { BUSINESS } from '../../data/business';
import { I18nService } from './i18n.service';
import { localizedAddress, openingHoursText } from './business-copy';

describe('business copy per language', () => {
  let i18n: I18nService;
  const partialWeek = [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:00' },
    { days: ['Saturday'], opens: '10:00', closes: '14:00' }
  ];

  beforeEach(() => {
    i18n = TestBed.inject(I18nService);
  });

  it('uses the Cyrillic address in Bulgarian and the transliterated one elsewhere', () => {
    expect(localizedAddress('bg')).toBe(BUSINESS.displayAddress);
    expect(localizedAddress('en')).toBe(BUSINESS.displayAddressEn);
  });

  it('formats the Bulgarian hours the way the facts write them', () => {
    expect(openingHoursText(i18n)).toBe('всеки ден от 9:00 до 18:00');
    expect(openingHoursText(i18n, partialWeek)).toBe('пон.–пет. от 9:00 до 18:00; съб. от 10:00 до 14:00');
  });

  it('formats English hours, including partial weeks', async () => {
    await i18n.use('en');
    expect(openingHoursText(i18n)).toBe('every day, 9:00–18:00');
    expect(openingHoursText(i18n, partialWeek)).toBe('Mon–Fri 9:00–18:00; Sat 10:00–14:00');
  });
});
