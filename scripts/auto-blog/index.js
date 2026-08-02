// Orchestrator for the automated blog post generation pipeline.
//   1. Scrape (or fall back to) a topic idea.
//   2. Generate the article + SEO metadata via Claude.
//   3. Scaffold all required Angular files and registry/route updates.

// Load .env when running locally (no-op in CI where env vars come from secrets).
const path = require('path');
const envPath = path.resolve(__dirname, '../../.env');
if (require('fs').existsSync(envPath)) {
  require('fs').readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (key && !(key in process.env)) process.env[key] = val;
    });
}

const { execSync } = require('child_process');
const { getTopicIdea } = require('./scrape-ideas');
const { generateArticle } = require('./generate-article');
const { scaffoldArticle } = require('./scaffold-component');
const { generateCoverImage } = require('./generate-image');
const { preflight } = require('./preflight');

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

  console.log('::group::Scaffold files');
  const result = scaffoldArticle(article, coverImagePath);
  console.log(JSON.stringify(result, null, 2));
  console.log('::endgroup::');

  console.log('::group::Generate sitemap');
  const sitemapScript = path.resolve(__dirname, '../generate-sitemap.js');
  execSync(`node "${sitemapScript}"`, { stdio: 'inherit', cwd: path.resolve(__dirname, '../..') });
  console.log('[sitemap] regenerated successfully');
  console.log('::endgroup::');

  console.log('::group::Generate llms.txt');
  const llmsScript = path.resolve(__dirname, '../generate-llms.js');
  execSync(`node "${llmsScript}"`, { stdio: 'inherit', cwd: path.resolve(__dirname, '../..') });
  console.log('[llms] regenerated successfully');
  console.log('::endgroup::');

  // Emit summary for GitHub Actions step outputs / job summary.
  const summary = [
    `Created blog post: ${result.slug}`,
    `Title: ${article.seo.title}`,
    `Component: ${result.componentDir}`,
    `Markdown: ${result.markdownFile}`,
    `BlogService id: ${result.id}`,
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
