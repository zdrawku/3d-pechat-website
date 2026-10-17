import faq from './faq.json';
import business from './business.json';

/**
 * The FAQ may only state what business.json says (CLAUDE.md Rule 5). Prose
 * can't be compared word for word, so this guards the parts that drift: every
 * number in an answer must also appear in the facts, and the answers must
 * never offer what the business doesn't do.
 */
describe('faq.json', () => {
  const factsText = business.facts.join(' ');
  const numbersIn = (text: string): string[] => text.match(/\d+(?:[.,]\d+)?/g) ?? [];
  const factNumbers = new Set(numbersIn(factsText));

  it('has 6–10 unique, non-empty questions', () => {
    expect(faq.length).toBeGreaterThanOrEqual(6);
    expect(faq.length).toBeLessThanOrEqual(10);
    expect(new Set(faq.map(f => f.id)).size).toBe(faq.length);
    for (const f of faq) {
      expect(f.question.trim().endsWith('?')).withContext(f.id).toBeTrue();
      expect(f.answer.trim().length).withContext(f.id).toBeGreaterThan(20);
      expect(f.icon).withContext(f.id).toMatch(/^[a-z_]+$/);
    }
  });

  it('uses no number that business.json facts don’t state', () => {
    for (const f of faq) {
      const unknown = numbersIn(f.answer).filter(n => !factNumbers.has(n));
      expect(unknown).withContext(`${f.id}: ${f.answer}`).toEqual([]);
    }
  });

  it('never offers SLA/SLS, scanning, same-day work or invoices', () => {
    for (const f of faq) {
      expect(f.answer).withContext(f.id).not.toMatch(/\bSLA\b|\bSLS\b|сканиран|същия ден/i);
      // Invoices may only be mentioned to say we don't issue them.
      if (/фактур/i.test(f.answer)) {
        expect(f.answer).withContext(f.id).toContain('не издаваме фактури');
      }
    }
  });
});
