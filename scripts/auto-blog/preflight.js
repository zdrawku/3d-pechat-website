// Preflight checks for the auto-blog pipeline.
//
// The scaffolder edits app.routes.ts and blog.service.ts by regex, so it is
// coupled to their current formatting. When those files get refactored (as
// happened when blog routes moved to lazy `loadComponent`), the regexes stop
// matching and the run dies *after* burning a Claude API call and an image
// generation. These checks run first and fail fast with a message that says
// exactly which file drifted and what to fix.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const ROUTES_FILE = path.join(ROOT, 'src/app/app.routes.ts');
const SERVICE_FILE = path.join(ROOT, 'src/app/services/blog.service.ts');

/** Anchors the scaffolder relies on, each with a repair hint. */
const CHECKS = [
  {
    file: ROUTES_FILE,
    label: 'app.routes.ts',
    pattern: /path:\s*'blog'\s*,\s*children:\s*\[[\s\S]*?\n\s*\]\s*\}/,
    hint:
      "the `{ path: 'blog', children: [ … ] }` block — updateRoutes() in " +
      'scaffold-component.js appends the new lazy route inside it'
  },
  {
    file: ROUTES_FILE,
    label: 'app.routes.ts',
    pattern: /loadComponent:\s*\(\)\s*=>\s*import\('\.\/blog\//,
    hint:
      'at least one lazy blog route of the form ' +
      "`loadComponent: () => import('./blog/<slug>/<slug>.component').then(m => m.<Class>)`. " +
      'If blog routes moved back to static imports, updateRoutes() must be rewritten to match'
  },
  {
    file: SERVICE_FILE,
    label: 'blog.service.ts',
    pattern: /(\/\/ Add more blog posts here)|(\n\s*\];)/,
    hint:
      'the `// Add more blog posts here` marker (or a closing `];` of the ' +
      'blogPosts array) — updateBlogService() inserts the new entry there'
  }
];

function preflight() {
  const failures = [];

  for (const check of CHECKS) {
    if (!fs.existsSync(check.file)) {
      failures.push(`${check.label}: file not found at ${check.file}`);
      continue;
    }
    const src = fs.readFileSync(check.file, 'utf8');
    if (!check.pattern.test(src)) {
      failures.push(`${check.label}: could not find ${check.hint}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(
      'Auto-blog preflight failed — the scaffolder no longer matches the files ' +
        'it edits:\n' +
        failures.map(f => `  • ${f}`).join('\n') +
        '\n\nFix scripts/auto-blog/scaffold-component.js to match the current ' +
        'file format (and update scripts/auto-blog/preflight.js alongside it).'
    );
  }

  console.log('[preflight] scaffolder anchors OK');
}

module.exports = { preflight };
