// Preflight checks for the auto-blog pipeline.
//
// The scaffolder (scaffold-post.js) inserts the new entry into
// blog-posts.registry.ts by regex and adds the English translation to
// src/i18n/locales.json and src/i18n/en/content/blog.json. If one of those
// files drifts, the run would die *after* burning a Claude API call and an
// image generation. These checks run first and fail fast with a message that
// says exactly which file drifted and what to fix. (No route or component is
// generated any more: every post is served by src/app/blog/article/.)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const REGISTRY_FILE = path.join(ROOT, 'src/app/services/blog-posts.registry.ts');
const LOCALES_FILE = path.join(ROOT, 'src/i18n/locales.json');
const EN_COPY_FILE = path.join(ROOT, 'src/i18n/en/content/blog.json');

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Each check returns a problem description, or null when the file is as the scaffolder expects. */
const CHECKS = [
  {
    label: 'blog-posts.registry.ts',
    file: REGISTRY_FILE,
    problem: (src) => (/export const BLOG_POSTS: BlogPost\[\] = \[/.test(src) && /(\/\/ Add more blog posts here)|(\n\s*\];)/.test(src)
      ? null
      : 'could not find the `BLOG_POSTS` array and its `// Add more blog posts here` marker (or closing `];`) — insertRegistryEntry() inserts the new entry there')
  },
  {
    label: 'src/i18n/locales.json',
    file: LOCALES_FILE,
    problem: (src) => {
      const locales = JSON.parse(src);
      return isObject(locales.translatedPosts) && isObject(locales.translatedPosts.en)
        ? null
        : 'no `translatedPosts.en` object — addTranslation() adds the English slug there';
    }
  },
  {
    label: 'src/i18n/en/content/blog.json',
    file: EN_COPY_FILE,
    problem: (src) => (isObject(JSON.parse(src)) ? null : 'not a JSON object keyed by Bulgarian slug — addTranslation() adds the English copy there')
  }
];

function preflight() {
  const failures = [];

  for (const check of CHECKS) {
    if (!fs.existsSync(check.file)) {
      failures.push(`${check.label}: file not found at ${check.file}`);
      continue;
    }
    try {
      const problem = check.problem(fs.readFileSync(check.file, 'utf8'));
      if (problem) failures.push(`${check.label}: ${problem}`);
    } catch (err) {
      failures.push(`${check.label}: ${err.message}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(
      'Auto-blog preflight failed — the scaffolder no longer matches the files ' +
        'it edits:\n' +
        failures.map(f => `  • ${f}`).join('\n') +
        '\n\nFix scripts/auto-blog/scaffold-post.js to match the current ' +
        'file format (and update scripts/auto-blog/preflight.js alongside it).'
    );
  }

  console.log('[preflight] scaffolder anchors OK');
}

module.exports = { preflight };
