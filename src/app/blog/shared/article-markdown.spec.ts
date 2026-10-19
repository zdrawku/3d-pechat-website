import { faqFromMarkdown, fillMakerWorldSection, splitAtVideo } from './article-markdown';

describe('article markdown markers', () => {
  it('splits the text at the video marker, or keeps it whole', () => {
    expect(splitAtVideo('# A\n\n<!-- video -->\n\n## B')).toEqual(['# A\n\n', '\n\n## B']);
    expect(splitAtVideo('# A')).toEqual(['# A', '']);
  });

  it('fills the MakerWorld section, or drops it whole when there is no link', () => {
    const text = 'Intro\n<!-- makerworld -->\n[Model]({{MAKERWORLD_URL}}) and [again]({{MAKERWORLD_URL}})\n<!-- /makerworld -->\nEnd';
    expect(fillMakerWorldSection(text, 'https://m.example/1')).toBe('Intro\n\n[Model](https://m.example/1) and [again](https://m.example/1)\n\nEnd');
    expect(fillMakerWorldSection(text, '')).toBe('Intro\n\nEnd');
    expect(fillMakerWorldSection('No section', 'https://m.example/1')).toBe('No section');
  });

  it('reads the FAQ section as plain-text questions and answers', () => {
    const text = [
      '## Something else',
      '### Not a question in the FAQ',
      'Ignored.',
      '<!-- faq -->',
      '## Frequently asked questions',
      '',
      '### Do I need a **3D model**?',
      '',
      'No. Send a [sketch or a photo](/en/contact/) — *we help* from idea to model.',
      '',
      'Files: `STL` or 3MF.',
      '',
      '### How fast do you reply?',
      '',
      'Usually within a day.',
      '<!-- /faq -->'
    ].join('\n');

    expect(faqFromMarkdown(text)).toEqual([
      { question: 'Do I need a 3D model?', answer: 'No. Send a sketch or a photo — we help from idea to model. Files: STL or 3MF.' },
      { question: 'How fast do you reply?', answer: 'Usually within a day.' }
    ]);
  });

  it('finds no FAQ without the markers', () => {
    expect(faqFromMarkdown('## FAQ\n\n### Q?\n\nA.')).toEqual([]);
  });
});
