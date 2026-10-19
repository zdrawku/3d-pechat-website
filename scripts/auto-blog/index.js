// Orchestrator for the automated blog post generation pipeline.
//   1. Scrape (or fall back to) a topic idea.
//   2. Generate the Bulgarian article + SEO metadata via Claude.
//   3. File it: markdown + blog-posts.registry.ts entry (scaffold-post.js).
//   4. Draft its English version via Claude and file it too (translate-article.js):
//      src/assets/blogs/en/<slug>.md, src/i18n/en/content/blog.json, locales.json.
//   5. Regenerate the derived files (images, content maps, sitemap, llms.txt).
// The workflow opens one PR with both languages; nothing goes live unreviewed.

require('./env').loadEnv();

const path = require('path');
const { execSync } = require('child_process');
const { getTopicIdea } = require('./scrape-ideas');
const { generateArticle } = require('./generate-article');
const { scaffoldPost, scaffoldTranslation } = require('./scaffold-post');
const { translateArticle } = require('./translate-article');
const { generateCoverImage } = require('./generate-image');
const { preflight } = require('./preflight');

const ROOT = path.resolve(__dirname, '../..');

/** Runs one of the repo's generator scripts (scripts/<name>.js). */
function regenerate(name) {
  execSync(`node "${path.resolve(__dirname, `../${name}.js`)}"`, { stdio: 'inherit', cwd: ROOT });
}

async function main() {
  // Verify the scaffolder still matches the files it edits BEFORE spending a
  // Claude API call and an image generation on an article that can't be filed.
  console.log('::group::Preflight');
  preflight();
  console.log('::endgroup::');

  console.log('::group::Pick topic');
  const topic = await getTopicIdea();
  console.log(JSON.stringify(topic, null, 2));
  console.log('::endgroup::');

  console.log('::group::Generate article');
  const article = await generateArticle(topic);
  console.log(`Generated slug: ${article.slug}`);
  console.log(`Title: ${article.seo.title}`);
  console.log(`Words: ~${article.markdown.split(/\s+/).length}`);
  console.log('::endgroup::');

  console.log('::group::Generate cover image');
  let coverImagePath = null;
  try {
    coverImagePath = await generateCoverImage(article.slug, article.seo.imagePrompt);
  } catch (err) {
    console.warn(`[generate-image] failed, continuing without cover: ${err.message}`);
  }
  console.log('::endgroup::');

  console.log('::group::File the post');
  const result = scaffoldPost(article, coverImagePath);
  console.log(JSON.stringify(result, null, 2));
  console.log('::endgroup::');

  // The English draft rides in the same PR. If it fails, the Bulgarian post
  // still goes up for review on its own; `npm run translate-post -- <slug>`
  // adds the English version later.
  console.log('::group::Draft the English version');
  let translation = null;
  try {
    const english = await translateArticle({ markdown: article.markdown, seo: article.seo }, { date: article.seo.publishDate });
    translation = scaffoldTranslation({ source: result.slug, ...english });
    console.log(JSON.stringify(translation, null, 2));
  } catch (err) {
    console.warn(`[translate] failed, the PR carries the Bulgarian post only: ${err.message}`);
  }
  console.log('::endgroup::');

  // The cover arrives from Pollinations as JPEG/PNG. Convert it to WebP and let
  // the converter rewrite every reference (blog-posts.registry.ts and the
  // markdown in every language) so the PR needs no manual image fixup.
  console.log('::group::Optimize blog images');
  regenerate('generate-blog-images');
  console.log('::endgroup::');

  // The content maps are what the prerenderer reads; without regenerating them
  // the new markdown is never bundled and the post renders empty.
  console.log('::group::Generate blog content maps');
  regenerate('generate-blog-content');
  console.log('::endgroup::');

  console.log('::group::Generate sitemap');
  regenerate('generate-sitemap');
  console.log('::endgroup::');

  console.log('::group::Generate llms.txt');
  regenerate('generate-llms');
  console.log('::endgroup::');

  // Emit summary for GitHub Actions step outputs / job summary.
  const summary = [
    `Created blog post: ${result.slug}`,
    `Title: ${article.seo.title}`,
    `Markdown: ${result.markdownFile}`,
    `Registry id: ${result.id}`,
    translation
      ? `English: /en/blog/${translation.slug}/ (${translation.markdownFile})`
      : 'English: not drafted — run `npm run translate-post -- ' + result.slug + '`',
    `Source: ${topic.sourceUrl}`
  ].join('\n');
  console.log('\n--- SUMMARY ---\n' + summary);

  if (process.env.GITHUB_STEP_SUMMARY) {
    require('fs').appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## Auto-generated blog post\n\n\`\`\`\n${summary}\n\`\`\`\n`
    );
  }
}

main().catch(err => {
  console.error('[auto-blog] FAILED:', err && err.stack || err);
  process.exit(1);
});
