import { Component, Input } from '@angular/core';
import { IGX_CARD_DIRECTIVES, IgxIconComponent } from 'igniteui-angular';

import faqData from '../../../data/faq.json';

/** One visible question and answer. The list lives in src/data/faq.json (Rule 4). */
export interface FaqItem {
  /** Stable anchor: the card is reachable as #faq-<id>. */
  id: string;
  /** Material icon name for the card. */
  icon: string;
  question: string;
  answer: string;
}

/** The site FAQ. Facts only from src/data/business.json (CLAUDE.md Rule 5); faq.spec.ts guards it. */
export const FAQ: FaqItem[] = faqData;

/**
 * „Често задавани въпроси“ — always-visible Q&A cards (design variant A of
 * AI-VISIBILITY-PLAN.md Phase 4, artifact in FEATURE-IDEAS-PLAN.md). Every
 * answer is in the prerendered HTML, so search engines and AI assistants can
 * quote it; the host page adds the matching FAQPage schema with
 * `faqPageSchema(FAQ)` from seo.service.ts. No accordion on purpose: a
 * collapsed panel keeps its answer out of the static HTML.
 */
@Component({
  selector: 'app-faq',
  imports: [IGX_CARD_DIRECTIVES, IgxIconComponent],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})
export class FaqComponent {
  @Input() items: FaqItem[] = FAQ;
  @Input() heading = 'Често задавани въпроси';
  @Input() intro = 'Кратки отговори за цени, срокове, файлове и доставка – всичко, което питат преди поръчка.';
}
