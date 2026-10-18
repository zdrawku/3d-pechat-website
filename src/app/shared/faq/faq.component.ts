import { Component, Input, computed, inject } from '@angular/core';
import { IGX_CARD_DIRECTIVES, IgxIconComponent } from 'igniteui-angular';

import faqData from '../../../data/faq.json';
import type { FaqItem } from '../../models/faq.model';
import { I18nService } from '../../i18n/i18n.service';

export type { FaqItem };

/**
 * The Bulgarian FAQ — src/data/faq.json. Facts only from src/data/business.json
 * (CLAUDE.md Rule 5); faq.spec.ts guards it. Other languages' copies live in
 * src/i18n/<lang>/content/faq.json (same ids and order; i18n.spec.ts guards them).
 */
export const FAQ: FaqItem[] = faqData;

/** The FAQ in the page's language: that language's copy, or the Bulgarian source when it has none. */
export function faqFor(i18n: I18nService): FaqItem[] {
  const translated = i18n.content().faq;
  return translated.length ? translated : FAQ;
}

/**
 * „Често задавани въпроси“ — always-visible Q&A cards (design variant A of
 * AI-VISIBILITY-PLAN.md Phase 4, artifact in FEATURE-IDEAS-PLAN.md). Every
 * answer is in the prerendered HTML, so search engines and AI assistants can
 * quote it; the host page adds the matching FAQPage schema with
 * `faqPageSchema(faqFor(i18n))` from seo.service.ts. No accordion on
 * purpose: a collapsed panel keeps its answer out of the static HTML.
 *
 * Shows the FAQ in the page's language unless `items` is given.
 */
@Component({
  selector: 'app-faq',
  imports: [IGX_CARD_DIRECTIVES, IgxIconComponent],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})
export class FaqComponent {
  private readonly i18n = inject(I18nService);

  /** Overrides the page language's FAQ. */
  @Input() items?: FaqItem[];
  /** Overrides the translated heading. */
  @Input() heading?: string;
  /** Overrides the translated intro. */
  @Input() intro?: string;

  protected readonly languageFaq = computed(() => faqFor(this.i18n));

  protected get shownItems(): FaqItem[] {
    return this.items ?? this.languageFaq();
  }

  protected get shownHeading(): string {
    return this.heading ?? this.i18n.t('faq.heading');
  }

  protected get shownIntro(): string {
    return this.intro ?? this.i18n.t('faq.intro');
  }
}
