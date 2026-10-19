/** One visible question and answer. The list lives in src/data/faq.json (Rule 4). */
export interface FaqItem {
  /** Stable anchor: the card is reachable as #faq-<id>. */
  id: string;
  /** Material icon name for the card. */
  icon: string;
  question: string;
  answer: string;
}
