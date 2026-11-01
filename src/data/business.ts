/**
 * Typed access to business.json — the one source of truth for the business
 * identity and every claim about the service (CLAUDE.md Rule 5). Components
 * read the address, hours and contacts from here instead of hard-coding them,
 * so the visible text always matches the LocalBusiness schema and the listing.
 * The address and opening hours as text, in the page's language, come from
 * src/app/i18n/business-copy.ts.
 */
import business from './business.json';

export const BUSINESS = business;
