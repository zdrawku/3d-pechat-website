/**
 * Second gate for the issue-form workflows (`add-product.yml`,
 * `make-short.yml`), next to check-issue-author.js: the issue must come from
 * its form. GitHub renders every form field as `### <label>`, in the form's
 * order, so an issue written by hand — or one that got the label later —
 * doesn't drive the pipeline. The labels are read from the form itself
 * (.github/ISSUE_TEMPLATE/<TEMPLATE>), so there is one source.
 *
 * Env:
 *   TEMPLATE   — the form's file name, e.g. new-product.yml
 *   ISSUE_BODY — github.event.issue.body
 * Writes `template=true|false` to $GITHUB_OUTPUT.
 */
const fs = require('fs');
const path = require('path');

const TEMPLATES = path.join(__dirname, '..', '.github', 'ISSUE_TEMPLATE');

/** The field labels of an issue form, in order (plain YAML read, no dependency). */
function formLabels(yamlText) {
  return [...String(yamlText).matchAll(/^\s+label:\s*(.+?)\s*$/gm)].map((m) => m[1].replace(/^(['"])(.*)\1$/, '$2'));
}

/** True when every field heading of the form is in the body, in order. */
function fromTemplate(body, labels) {
  const text = String(body || '');
  let at = 0;
  for (const label of labels) {
    const i = text.indexOf(`### ${label}`, at);
    if (i === -1) return false;
    at = i + label.length;
  }
  return labels.length > 0;
}

function main() {
  const name = process.env.TEMPLATE || '';
  if (!/^[\w-]+\.ya?ml$/.test(name)) throw new Error(`TEMPLATE must be a form file name, got "${name}"`);
  const labels = formLabels(fs.readFileSync(path.join(TEMPLATES, name), 'utf8'));
  const ok = fromTemplate(process.env.ISSUE_BODY, labels);
  console.log(ok ? `The issue comes from ${name}.` : `The issue doesn't come from ${name} (its fields are missing) — refusing to run.`);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `template=${ok}\n`);
}

if (require.main === module) main();

module.exports = { formLabels, fromTemplate };
