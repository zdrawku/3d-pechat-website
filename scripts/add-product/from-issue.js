/**
 * Adds a product to `src/data/products.json` from a GitHub Issue created with
 * `.github/ISSUE_TEMPLATE/new-product.yml` (Idea 3, Phase 3 — "add from phone").
 *
 * Run by `.github/workflows/add-product.yml`, which enforces the owner-only
 * guard *before* this script runs. The script itself is a pure transform:
 * parse the issue body → download the attached images → convert to webp →
 * append the entry. The result is always a PR the owner still has to merge.
 *
 * Env:
 *   ISSUE_BODY   — the raw markdown body of the issue (required)
 *   GITHUB_TOKEN — used for downloading attachments on private repos (optional)
 */
const fs = require('fs');
const lib = require('./lib');

/**
 * GitHub issue *forms* render each field as `### Label` followed by the value.
 * Returns a map of lowercased label → trimmed value.
 */
function parseIssueForm(body) {
  const sections = {};
  // Split on headings, keeping the heading text with its block.
  const parts = body.split(/^###\s+/m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf('\n');
    const label = (nl === -1 ? part : part.slice(0, nl)).trim().toLowerCase();
    const value = (nl === -1 ? '' : part.slice(nl + 1)).trim();
    sections[label] = value;
  }
  return sections;
}

/** GitHub renders an unfilled optional field as this literal. */
function clean(value) {
  if (!value || value === '_No response_') return '';
  return value.trim();
}

/**
 * Extracts image URLs from a form field. GitHub renders an uploaded image in
 * one of three shapes depending on the client, so all three are handled:
 *   1. markdown  — `![alt](url)`
 *   2. HTML      — `<img width="…" alt="Image" src="url" />`, which is what the
 *                  web and mobile uploaders emit for drag-and-dropped images
 *   3. bare URL  — occasionally left unwrapped
 */
function extractImageUrls(value) {
  if (!value) return [];
  const urls = [];
  let m;

  const md = /!\[[^\]]*\]\(([^)\s]+)\)/g;
  while ((m = md.exec(value)) !== null) urls.push(m[1]);

  // `src` may be single- or double-quoted, and is not necessarily the first
  // attribute on the tag.
  const html = /<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi;
  while ((m = html.exec(value)) !== null) urls.push(m[1]);

  if (urls.length === 0) {
    const bare = /https?:\/\/\S+/g;
    // Trim trailing punctuation and any quote/angle bracket that belonged to
    // the surrounding markup rather than the URL.
    while ((m = bare.exec(value)) !== null) urls.push(m[0].replace(/["'>),.]+$/, ''));
  }
  // De-duplicate while preserving the order (first = front, second = back).
  return [...new Set(urls)];
}

async function download(url) {
  const headers = { 'User-Agent': '3dpechat-add-product' };
  // Private-repo attachments need auth; public ones ignore the header.
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const body = process.env.ISSUE_BODY;
  if (!body) {
    throw new Error('ISSUE_BODY is empty — nothing to do.');
  }

  const fields = parseIssueForm(body);
  const name = clean(fields['име на продукта']);
  const description = clean(fields['описание']);
  const rawTags = clean(fields['ключови думи']);
  const featured = clean(fields['основен продукт?']).toLowerCase() === 'да';
  const modelUrl = clean(fields['линк към модела (по избор)']);
  const imageUrls = extractImageUrls(clean(fields['снимки']));

  if (!name || !description) {
    throw new Error('Missing required field: name and/or description.');
  }
  if (imageUrls.length === 0) {
    throw new Error('No images found in the issue — attach at least one photo.');
  }

  const products = lib.readProducts();
  const slug = lib.slugify(name);

  console.log(`::group::Download ${imageUrls.length} image(s)`);
  const buffers = [];
  for (const url of imageUrls.slice(0, 2)) {
    console.log(`  ${url}`);
    buffers.push(await download(url));
  }
  console.log('::endgroup::');

  console.log('::group::Convert to webp');
  const frontImage = await lib.convertImage(buffers[0], slug);
  console.log(`  front: ${frontImage}`);
  let backImage;
  if (buffers[1]) {
    backImage = await lib.convertImage(buffers[1], `${slug}-back`);
    console.log(`  back:  ${backImage}`);
  }
  console.log('::endgroup::');

  const tags = rawTags
    ? rawTags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const links = modelUrl
    ? [{ label: 'Виж модела в MakerWorld', url: modelUrl }]
    : undefined;

  const entry = lib.buildProduct(products, {
    name,
    description,
    frontImage,
    backImage,
    tags,
    featured,
    links,
  });
  lib.appendProduct(entry);

  console.log('\n--- SUMMARY ---');
  const summary = [
    `Added product: ${entry.name}`,
    `id: ${entry.id}`,
    `linkId: ${entry.linkId}`,
    `images: ${[frontImage, backImage].filter(Boolean).join(', ')}`,
    `tags: ${(entry.tags || []).join(', ') || '(none)'}`,
    `featured: ${entry.featured ? 'yes' : 'no'}`,
  ].join('\n');
  console.log(summary);

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## Product added from issue\n\n\`\`\`\n${summary}\n\`\`\`\n`
    );
  }

  // Expose values the workflow uses for the branch/PR title.
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `link_id=${entry.linkId}\nproduct_name=${entry.name}\n`
    );
  }
}

main().catch((err) => {
  console.error('[add-product/from-issue] FAILED:', (err && err.stack) || err);
  process.exit(1);
});
