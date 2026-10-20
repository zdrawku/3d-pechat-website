import { BUSINESS } from '../../data/business';
import { LOCALES, Locale } from '../i18n/locales';
import { LEGAL_DOCS, LegalDoc, LegalText, legalParams, loadLegalText, parseLegalText } from './legal-docs';

describe('parseLegalText', () => {
  it('reads the summary points and the sections', () => {
    const text = parseLegalText([
      '- `person` Who runs the site.',
      '- `delete_sweep` How long we keep data.',
      '',
      '## Who we are {#who}',
      'First paragraph.',
      '',
      '- a list',
      '## Cookies {#cookies}',
      'Second.'
    ].join('\r\n'));

    expect(text.summary).toEqual([
      { icon: 'person', text: 'Who runs the site.' },
      { icon: 'delete_sweep', text: 'How long we keep data.' }
    ]);
    expect(text.sections).toEqual([
      { id: 'who', title: 'Who we are', body: 'First paragraph.\n\n- a list' },
      { id: 'cookies', title: 'Cookies', body: 'Second.' }
    ]);
  });

  it('fails on a heading without an id, stray text before the first section, or no sections', () => {
    expect(() => parseLegalText('## No id\ntext')).toThrowError(/needs an id/);
    expect(() => parseLegalText('Intro paragraph\n## A {#a}\nx')).toThrowError(/only "- `icon` text" points/);
    expect(() => parseLegalText('- `person` only a point')).toThrowError(/no "## Title \{#id\}" sections/);
  });
});

describe('the legal texts (src/legal/<lang>/<doc>.md)', () => {
  const docs = Object.keys(LEGAL_DOCS) as LegalDoc[];
  const texts = new Map<string, LegalText>();

  beforeAll(async () => {
    for (const { code } of LOCALES) {
      for (const doc of docs) {
        texts.set(`${code}/${doc}`, await loadLegalText(doc, code as Locale));
      }
    }
  });

  const text = (locale: string, doc: LegalDoc) => texts.get(`${locale}/${doc}`)!;
  const allText = (t: LegalText) => [...t.summary.map((p) => p.text), ...t.sections.flatMap((s) => [s.title, s.body])].join('\n');

  for (const doc of docs) {
    it(`${doc}: every language has the same sections, in the same order, and the same summary icons`, () => {
      const source = text('bg', doc);
      expect(source.summary.length).withContext('summary points').toBeGreaterThan(2);
      for (const { code } of LOCALES) {
        expect(text(code, doc).sections.map((s) => s.id)).withContext(code).toEqual(source.sections.map((s) => s.id));
        expect(text(code, doc).summary.map((p) => p.icon)).withContext(code).toEqual(source.summary.map((p) => p.icon));
      }
    });

    it(`${doc}: fills every {placeholder} from business.json and names the operator`, () => {
      for (const { code } of LOCALES) {
        const body = allText(text(code, doc));
        expect(body).withContext(code).not.toMatch(/\{\w+\}/);
        expect(body).withContext(code).toContain(legalParams(code as Locale)['operator']);
        expect(body).withContext(code).toContain(BUSINESS.email);
      }
    });

    it(`${doc}: states amounts in euro only (no leva)`, () => {
      for (const { code } of LOCALES) {
        expect(allText(text(code, doc))).withContext(code).not.toMatch(/\bлв\b|\bлева\b|\bBGN\b|\bleva\b/i);
      }
    });
  }

  // The consent card's „Повече за данните“ link and the contact form point here.
  it('privacy: has the sections the site links to', () => {
    const ids = text('bg', 'privacy').sections.map((s) => s.id);
    expect(ids).toContain('cookies');
    expect(ids).toContain('retention');
  });
});
