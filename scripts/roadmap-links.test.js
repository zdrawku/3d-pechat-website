// Every "Details" link in ROADMAP.md (shown as a GitHub link in the Studio's
// Roadmap tab) must point at a file in the repo and, when it has an anchor, at
// a heading of that file — with GitHub's heading id, so the link lands there.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/** GitHub's heading id: lower case, punctuation and symbols (emoji too) dropped, each space a hyphen. */
function githubSlug(heading) {
  return heading.trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
}

const roadmap = fs.readFileSync(path.join(ROOT, 'ROADMAP.md'), 'utf8');
const links = [...roadmap.matchAll(/^- Details: \[([^\]]+)\]\(([^)#]+)(?:#([^)]+))?\)/gm)]
  .map(([, label, file, anchor]) => ({ label, file, anchor }));

test('githubSlug matches GitHub for emoji, dashes and Cyrillic', () => {
  assert.strictEqual(githubSlug('1. 🔴 Now — small effort, high impact'), '1--now--small-effort-high-impact');
  assert.strictEqual(githubSlug('🎨 Design artifacts — visual variants per idea'), '-design-artifacts--visual-variants-per-idea');
  assert.strictEqual(githubSlug('Idea 1 — 🎁 "Кутия Изненада" (Surprise Gift Box) product'), 'idea-1---кутия-изненада-surprise-gift-box-product');
});

test('ROADMAP.md has Details links', () => {
  assert.ok(links.length > 10, `only ${links.length} links found`);
});

for (const { label, file, anchor } of links) {
  test(`${label} → ${file}${anchor ? '#' + anchor : ''}`, () => {
    const target = path.join(ROOT, file);
    assert.ok(fs.existsSync(target), `${file} is not in the repo`);
    if (anchor) {
      const text = fs.readFileSync(target, 'utf8').replace(/```[\s\S]*?```/g, '');
      const slugs = [...text.matchAll(/^#{1,6} (.+)$/gm)].map(m => githubSlug(m[1]));
      assert.ok(slugs.includes(anchor), `${file} has no heading with the id "${anchor}"`);
    }
  });
}
