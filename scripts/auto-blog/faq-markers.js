// Marks an article's FAQ section so the page turns it into FAQPage schema
// (src/app/blog/shared/article-markdown.ts reads `<!-- faq -->` … `<!-- /faq -->`).
// Used by the scaffolder for every generated or translated post, so a model
// that forgets the markers can't cost the post its schema.

const FAQ_HEADING = /^## +(?:Често задавани въпроси|Frequently asked questions)(?:\s.*)?$/i;

/**
 * The markdown with its FAQ section — a `## Често задавани въпроси` /
 * `## Frequently asked questions` heading with `### question` entries, up to
 * the next `## ` heading — wrapped in the markers. Unchanged when the section
 * is missing, has no questions or is already marked. Keeps the line endings.
 */
function wrapFaqSection(markdown) {
  if (markdown.includes('<!-- faq -->')) return markdown;
  const eol = markdown.includes('\r\n') ? '\r\n' : '\n';
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => FAQ_HEADING.test(line));
  if (start === -1) return markdown;
  let end = lines.findIndex((line, i) => i > start && /^## /.test(line));
  if (end === -1) end = lines.length;
  let last = end - 1;
  while (last > start && !lines[last].trim()) last--;
  if (!lines.slice(start, last + 1).some((line) => /^### /.test(line))) return markdown;
  return [
    ...lines.slice(0, start),
    '<!-- faq -->',
    ...lines.slice(start, last + 1),
    '<!-- /faq -->',
    ...lines.slice(last + 1)
  ].join(eol);
}

module.exports = { wrapFaqSection };
