// Drafts the English version of a published Bulgarian post and files it,
// exactly as the auto-blog pipeline does for a new one:
//
//   npm run translate-post -- <bulgarian-slug>
//
// Needs ANTHROPIC_API_KEY (in .env locally). Writes
// src/assets/blogs/en/<english-slug>.md, the copy in
// src/i18n/en/content/blog.json and the slug in src/i18n/locales.json, then
// regenerates the content maps, sitemap and llms.txt. Review the draft (facts,
// links, slug — a published slug is permanent) before committing it.

require('./env').loadEnv();

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { readLocales } = require('../locale-urls');
const { readRegistryEntry, scaffoldTranslation } = require('./scaffold-post');
const { LOCALE, translateArticle } = require('./translate-article');

const ROOT = path.resolve(__dirname, '../..');

async function main() {
  const slug = process.argv[2];
  if (!slug) throw new Error('usage: npm run translate-post -- <bulgarian-slug>');
  const entry = readRegistryEntry(slug);
  if (!entry) throw new Error(`no post "${slug}" in blog-posts.registry.ts`);
  const existing = readLocales().translatedPosts?.[LOCALE]?.[slug];
  if (existing) throw new Error(`"${slug}" is already translated: /${LOCALE}/blog/${existing}/`);
  const markdown = fs.readFileSync(path.join(ROOT, 'src/assets/blogs', `${slug}.md`), 'utf8');

  const english = await translateArticle({ markdown, seo: entry });
  const result = scaffoldTranslation({ locale: LOCALE, source: slug, ...english });
  for (const script of ['generate-blog-content', 'generate-sitemap', 'generate-llms']) {
    execSync(`node "${path.resolve(__dirname, `../${script}.js`)}"`, { stdio: 'inherit', cwd: ROOT });
  }
  console.log(`\n✅ /${LOCALE}/blog/${result.slug}/ drafted (${result.markdownFile}). Review it, then npm run build.`);
}

main().catch((err) => {
  console.error(`❌ translate-post: ${err.message}`);
  process.exit(1);
});
