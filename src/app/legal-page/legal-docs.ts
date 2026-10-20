import { BUSINESS, formatPhone } from '../../data/business';
import { localizedAddress } from '../i18n/business-copy';
import { interpolate } from '../i18n/i18n.service';
import { DEFAULT_LOCALE, Locale } from '../i18n/locales';

/**
 * The Privacy Policy (/privacy/) and the Terms of Use (/terms/), approved
 * design „B“ (FEATURE-IDEAS-PLAN.md, artifact "Legal Pages Layout"). Their text
 * is markdown per language in src/legal/<lang>/<doc>.md — see
 * AI_INSTRUCTIONS.md § Legal pages for the format.
 */
export type LegalDoc = 'privacy' | 'terms';

export const LEGAL_DOCS: Record<LegalDoc, { dateModified: string; icon: string }> = {
  // Hand-maintained (CLAUDE.md Rule 5.3): bump when a document's text changes
  // in substance, together with its MAIN_PAGE_LASTMOD entries in
  // scripts/generate-sitemap.js. The page shows it as „Последна промяна“.
  privacy: { dateModified: '2026-10-20', icon: 'privacy_tip' },
  terms: { dateModified: '2026-10-20', icon: 'handshake' },
};

/** Every language must have both texts: a new language is a compile error until they exist. */
const TEXTS: Record<Locale, Record<LegalDoc, () => Promise<{ default: string }>>> = {
  bg: {
    privacy: () => import('../../legal/bg/privacy.md'),
    terms: () => import('../../legal/bg/terms.md')
  },
  en: {
    privacy: () => import('../../legal/en/privacy.md'),
    terms: () => import('../../legal/en/terms.md')
  }
};

export interface LegalPoint {
  /** A Material icon name. */
  icon: string;
  text: string;
}

export interface LegalSection {
  /** The same in every language, so /privacy/#cookies and /en/privacy/#cookies both work. */
  id: string;
  title: string;
  /** Markdown. */
  body: string;
}

export interface LegalText {
  /** The „Накратко“ card. */
  summary: LegalPoint[];
  sections: LegalSection[];
}

/**
 * The facts a legal text may name, from business.json (Rule 5) — written in
 * the markdown as {operator}, {operatorAddress} (the permanent address),
 * {address} (where the work is done), {email}, {phone}, {freeDeliveryOver}.
 */
export function legalParams(locale: Locale): Record<string, string> {
  return {
    operator: locale === DEFAULT_LOCALE ? BUSINESS.operator.name : BUSINESS.operator.nameEn,
    operatorAddress: locale === DEFAULT_LOCALE ? BUSINESS.operator.address : BUSINESS.operator.addressEn,
    email: BUSINESS.email,
    phone: formatPhone(),
    address: localizedAddress(locale),
    freeDeliveryOver: String(BUSINESS.freeDeliveryOverEur)
  };
}

const POINT = /^- `([a-z_]+)` (.+)$/;
const HEADING = /^## (.+?) \{#([a-z0-9-]+)\}$/;

/**
 * Reads a legal text's markdown:
 *
 *     - `person` A point of the „Накратко“ card (a Material icon, then the text)
 *
 *     ## A section title {#section-id}
 *     The section's markdown…
 *
 * Section numbers are added by the page. Anything else before the first
 * section, a heading without an id, or a text with no sections throws — so a
 * malformed text fails the prerender instead of shipping.
 */
export function parseLegalText(markdown: string): LegalText {
  const summary: LegalPoint[] = [];
  const sections: LegalSection[] = [];
  let body: string[] = [];
  const close = () => {
    const section = sections.at(-1);
    if (section) {
      section.body = body.join('\n').trim();
    }
    body = [];
  };

  for (const line of markdown.replace(/\r\n/g, '\n').split('\n')) {
    if (line.startsWith('## ')) {
      const heading = HEADING.exec(line.trim());
      if (!heading) {
        throw new Error(`Legal text: a section heading needs an id, "## Title {#id}": ${line}`);
      }
      close();
      sections.push({ id: heading[2], title: heading[1], body: '' });
    } else if (sections.length) {
      body.push(line);
    } else if (line.trim()) {
      const point = POINT.exec(line.trim());
      if (!point) {
        throw new Error(`Legal text: before the first section only "- \`icon\` text" points are allowed: ${line}`);
      }
      summary.push({ icon: point[1], text: point[2] });
    }
  }
  close();

  if (!sections.length) {
    throw new Error('Legal text: no "## Title {#id}" sections');
  }
  return { summary, sections };
}

/** A document's text in `locale`, with the business facts filled in. Used by the route's resolver. */
export async function loadLegalText(doc: LegalDoc, locale: Locale): Promise<LegalText> {
  const markdown = (await TEXTS[locale][doc]()).default;
  return parseLegalText(interpolate(markdown, legalParams(locale)));
}
