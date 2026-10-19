/**
 * Markers an article's markdown can carry, in every language (read by the
 * article page, src/app/blog/article/, and the scaffolder's faq-markers.js):
 *
 * - `<!-- video -->` — where the page puts its player (the markdown sanitiser
 *   strips <iframe> and <video>, so players live in the template);
 * - `<!-- makerworld -->` … `<!-- /makerworld -->` — a section whose
 *   `{{MAKERWORLD_URL}}` placeholders take a model link, dropped whole when
 *   there is no link, so a literal placeholder can never ship;
 * - `<!-- faq -->` … `<!-- /faq -->` — a „### question“ + answer list that
 *   becomes the page's FAQPage schema, word for word.
 */

/** The markdown before and after the `<!-- video -->` marker ('' after when there is none). */
export function splitAtVideo(markdown: string): [string, string] {
  const [before, after = ''] = markdown.split('<!-- video -->');
  return [before, after];
}

/** Fills the `<!-- makerworld -->` section with `url`, or removes the section when `url` is empty. */
export function fillMakerWorldSection(markdown: string, url: string): string {
  return markdown.replace(
    /<!-- makerworld -->([\s\S]*?)<!-- \/makerworld -->/,
    (_, section: string) => (url ? section.replaceAll('{{MAKERWORLD_URL}}', url) : '')
  );
}

/** Markdown inline formatting → plain text: links keep their text, emphasis and code marks go. */
function plainText(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(^|[^\w*])\*(?!\s)([^*]+?)\*/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The questions and answers of the `<!-- faq -->` section, as plain text: one
 * per `### ` heading, its answer the text under it. [] when there is no section.
 */
export function faqFromMarkdown(markdown: string): { question: string; answer: string }[] {
  const section = /<!-- faq -->([\s\S]*?)<!-- \/faq -->/.exec(markdown)?.[1];
  if (!section) {
    return [];
  }
  return section
    .split(/^### +/m)
    .slice(1)
    .map((block) => {
      const [heading, ...answer] = block.split('\n');
      return { question: plainText(heading), answer: plainText(answer.join('\n')) };
    })
    .filter(({ question, answer }) => question && answer);
}
