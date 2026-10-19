import { Component, computed, inject } from '@angular/core';
import { IGX_CARD_DIRECTIVES, IgxIconComponent } from 'igniteui-angular';

import faqData from '../../../data/faq.json';
import type { FaqItem } from '../../models/faq.model';
import { I18nService } from '../../i18n/i18n.service';
import { TranslatePipe } from '../../i18n/translate.pipe';

/**
 * The Bulgarian FAQ — src/data/faq.json. Facts only from src/data/business.json
 * (CLAUDE.md Rule 5); faq.spec.ts guards it. Other languages' question/answer
 * copy lives in src/i18n/<lang>/content/faq.json, keyed by id (i18n.spec.ts guards it).
 */
export const FAQ: FaqItem[] = faqData;

/**
 * The FAQ in the page's language: each entry's question and answer from that
 * language's copy; ids, icons and order always from faq.json.
 */
export function faqFor(i18n: I18nService): FaqItem[] {
  const copy = i18n.content().faq;
  return FAQ.map((item) => (copy[item.id] ? { ...item, ...copy[item.id] } : item));
}

/**
 * „Често задавани въпроси“ — always-visible Q&A cards (design variant A of
 * AI-VISIBILITY-PLAN.md Phase 4, artifact in FEATURE-IDEAS-PLAN.md). Every
 * answer is in the prerendered HTML, so search engines and AI assistants can
 * quote it; the host page adds the matching FAQPage schema with
 * `faqPageSchema(faqFor(i18n))` from seo.service.ts. No accordion on
 * purpose: a collapsed panel keeps its answer out of the static HTML.
 */
@Component({
  selector: 'app-faq',
  imports: [IGX_CARD_DIRECTIVES, IgxIconComponent, TranslatePipe],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})
export class FaqComponent {
  private readonly i18n = inject(I18nService);

  /** The FAQ in the page's language. */
  protected readonly items = computed(() => faqFor(this.i18n));
}
