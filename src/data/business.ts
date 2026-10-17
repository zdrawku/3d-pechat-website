/**
 * Typed access to business.json — the one source of truth for the business
 * identity and every claim about the service (CLAUDE.md Rule 5). Components
 * read the address, hours and contacts from here instead of hard-coding them,
 * so the visible text always matches the LocalBusiness schema and the listing.
 */
import business from './business.json';

export const BUSINESS = business;

const DAY_LABELS: Record<string, string> = {
  Monday: 'пон.', Tuesday: 'вт.', Wednesday: 'ср.', Thursday: 'чет.',
  Friday: 'пет.', Saturday: 'съб.', Sunday: 'нед.'
};

/** "09:00" → "9:00", the way Bulgarian copy writes times. */
const time = (hhmm: string): string => hhmm.replace(/^0(\d)/, '$1');

type OpeningHours = { days: string[]; opens: string; closes: string }[];

/**
 * Human-readable opening hours, e.g. „всеки ден от 9:00 до 18:00“.
 * Partial weeks list their days: „пон.–пет. от 9:00 до 18:00; съб. от 10:00 до 14:00“.
 */
export function openingHoursLabel(hours: OpeningHours = BUSINESS.openingHours): string {
  return hours
    .map(({ days, opens, closes }) => {
      const when = days.length === 7
        ? 'всеки ден'
        : days.length > 2
          ? `${DAY_LABELS[days[0]]}–${DAY_LABELS[days[days.length - 1]]}`
          : days.map(d => DAY_LABELS[d]).join(', ');
      return `${when} от ${time(opens)} до ${time(closes)}`;
    })
    .join('; ');
}

/** English opening hours for /en/, e.g. "Every day, 9:00–18:00" or "Mon–Fri 9:00–18:00". */
export function openingHoursLabelEn(hours: OpeningHours = BUSINESS.openingHours): string {
  return hours
    .map(({ days, opens, closes }) => {
      const span = `${time(opens)}–${time(closes)}`;
      if (days.length === 7) return `Every day, ${span}`;
      const short = (d: string) => d.slice(0, 3);
      const when = days.length > 2 ? `${short(days[0])}–${short(days[days.length - 1])}` : days.map(short).join(', ');
      return `${when} ${span}`;
    })
    .join('; ');
}

/** "€0.80–€1.50" — the tier range from business.json pricing (per 10 g). */
export function priceRangeEn(perTenGrams: number[] = BUSINESS.pricing.perTenGrams): string {
  return `€${Math.min(...perTenGrams).toFixed(2)}–€${Math.max(...perTenGrams).toFixed(2)}`;
}

/** "+359883310616" → "+359 883 310 616", the way the site prints the number. */
export function formatPhone(e164: string = BUSINESS.telephone): string {
  return e164.replace(/^\+359(\d{3})(\d{3})(\d{3})$/, '+359 $1 $2 $3');
}
