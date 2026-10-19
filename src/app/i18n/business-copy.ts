import { BUSINESS } from '../../data/business';
import type { I18nService } from './i18n.service';
import type { TranslationKey } from './i18n.types';
import { DEFAULT_LOCALE, Locale } from './locales';

/**
 * The street address in a language: the Cyrillic `displayAddress` for
 * Bulgarian, the transliterated `displayAddressEn` for everything else (both in
 * business.json, so the copy always matches the schema and the map listing).
 */
export function localizedAddress(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? BUSINESS.displayAddress : BUSINESS.displayAddressEn;
}

/** "09:00" → "9:00", the way the site writes times in every language. */
const time = (hhmm: string): string => hhmm.replace(/^0(\d)/, '$1');

type OpeningHours = { days: string[]; opens: string; closes: string }[];

/**
 * Opening hours from business.json in the active language — the site's one
 * formatter for them (business.spec.ts checks the Bulgarian text against the
 * facts): „всеки ден от 9:00 до 18:00“ / "every day, 9:00–18:00". Partial weeks
 * name their days from `common.days` („пон.–пет. …“ / "Mon–Fri …").
 */
export function openingHoursText(i18n: I18nService, hours: OpeningHours = BUSINESS.openingHours): string {
  return hours
    .map(({ days, opens, closes }) => {
      const times = { opens: time(opens), closes: time(closes) };
      if (days.length === 7) {
        return i18n.t('common.hours.everyDay', times);
      }
      const names = days.map((day) => i18n.t(`common.days.${day}` as TranslationKey));
      const span = names.length > 2 ? `${names[0]}–${names[names.length - 1]}` : names.join(', ');
      return i18n.t('common.hours.days', { days: span, ...times });
    })
    .join(i18n.t('common.listSeparator'));
}
