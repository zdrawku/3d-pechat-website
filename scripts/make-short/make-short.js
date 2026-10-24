#!/usr/bin/env node
/**
 * Local entry point for `/make-short` (.claude/skills/make-short/SKILL.md).
 *
 *   node scripts/make-short/make-short.js prepare --product <linkId|name> [--media <file|dir>]… [--no-catalog]
 *   node scripts/make-short/make-short.js draft   --product <linkId> [--idea "…"] [--voice bg-BG-KalinaNeural|none]
 *   node scripts/make-short/make-short.js check   --product <linkId>
 *   node scripts/make-short/make-short.js render  --product <linkId> [--music <file>] [--out <dir>]
 *
 * Work files go to tmp/make-short/<linkId>/ (manifest.json, previews/,
 * spec.json); the short goes to shorts/<linkId>/ — both are gitignored.
 * `draft` needs ANTHROPIC_API_KEY; without one, Claude Code looks at the
 * previews and writes spec.json itself, then runs `check`.
 */
const fs = require('fs');
const path = require('path');
const lib = require('./lib');
const { collect } = require('./collect');
const media = require('./media');

function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const opts = { media: [] };
  for (let i = 0; i < rest.length; i++) {
    const key = rest[i].replace(/^--/, '');
    if (key === 'no-catalog') opts.noCatalog = true;
    else if (key === 'media') opts.media.push(rest[++i]);
    else opts[key] = rest[++i];
  }
  return { cmd, opts };
}

const workDirFor = (product) => path.join(lib.ROOT, 'tmp', 'make-short', product.linkId);
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

function productFrom(opts) {
  const product = lib.findProduct(lib.readProducts(), opts.product);
  if (!product) throw new Error(`No product "${opts.product}" in src/data/products.json (use its linkId or exact name).`);
  return product;
}

/** Files given with --media (a folder means every photo/clip in it, clips first). */
function localExtras(paths) {
  const files = paths.flatMap((p) => (fs.statSync(p).isDirectory()
    ? fs.readdirSync(p).sort().map((f) => path.join(p, f))
    : [p])).filter((f) => media.kindOf(f));
  files.sort((a, b) => (media.kindOf(a) === 'video' ? 0 : 1) - (media.kindOf(b) === 'video' ? 0 : 1));
  return files.map((file) => ({ origin: 'local', ref: file, name: path.basename(file), file: path.resolve(file) }));
}

/** spec.json as written by Claude (Code), completed from the manifest. */
function loadSpec(product, workDir) {
  const manifest = readJson(path.join(workDir, 'manifest.json'));
  const spec = readJson(path.join(workDir, 'spec.json'));
  return { manifest, spec: { product: product.linkId, voice: 'bg-BG-KalinaNeural', ...spec, media: spec.media || require('./collect').publicMedia(manifest) } };
}

function check(product, workDir) {
  const { spec } = loadSpec(product, workDir);
  const business = lib.readBusiness();
  return [
    ...lib.validateSpec(spec),
    ...lib.factsCheck(lib.specTexts(spec), { facts: business.facts, sources: [product.name, product.description, spec.idea] }),
  ];
}

async function main() {
  const { cmd, opts } = parseArgs(process.argv.slice(2));
  const product = productFrom(opts);
  const workDir = workDirFor(product);

  if (cmd === 'prepare') {
    fs.rmSync(workDir, { recursive: true, force: true });
    const manifest = await collect({ product, extras: localExtras(opts.media), useCatalog: !opts.noCatalog, workDir });
    console.log(`Prepared ${Object.keys(manifest.media).length} media for ${product.name} in ${path.relative(lib.ROOT, workDir)}`);
    for (const [id, m] of Object.entries(manifest.media)) {
      console.log(`  ${id}  ${m.kind}${m.duration ? ` ${m.duration}s ${m.width}x${m.height}` : ''}  ${m.name}`);
    }
    console.log('Previews (look at these before writing spec.json):');
    for (const p of manifest.previews) console.log(`  ${p.id}${p.t !== undefined ? ` @ ${p.t}s` : ''}  ${p.file}`);
    for (const w of manifest.warnings) console.log(`  ! ${w}`);
  } else if (cmd === 'draft') {
    const { draftSpec } = require('./draft');
    const manifest = readJson(path.join(workDir, 'manifest.json'));
    const voice = opts.voice === 'none' ? null : opts.voice || 'bg-BG-KalinaNeural';
    const { spec, problems } = await draftSpec({ product, manifest, idea: opts.idea || '', voice });
    fs.writeFileSync(path.join(workDir, 'spec.json'), JSON.stringify(spec, null, 2));
    console.log(JSON.stringify(spec, null, 2));
    if (problems.length) console.log(`\nStill wrong after a retry:\n${problems.join('\n')}`);
  } else if (cmd === 'check') {
    const problems = check(product, workDir);
    if (problems.length) {
      console.log(problems.join('\n'));
      process.exitCode = 1;
    } else console.log('spec.json passes: structure, facts and never-claim checks.');
  } else if (cmd === 'render') {
    const problems = check(product, workDir);
    if (problems.length) throw new Error(`Fix spec.json first:\n${problems.join('\n')}`);
    const { renderShort } = require('./render');
    const { manifest, spec } = loadSpec(product, workDir);
    const files = Object.fromEntries(Object.entries(manifest.media).map(([id, m]) => [id, m.file]));
    const outDir = opts.out || path.join(lib.ROOT, 'shorts', product.linkId);
    const result = await renderShort({ spec, files, outDir, workDir: path.join(workDir, 'render'), music: opts.music });
    console.log(`Rendered ${result.seconds} s:\n  ${result.video}\n  ${result.cover}\n  ${result.post}`);
  } else {
    throw new Error('Usage: make-short.js prepare|draft|check|render --product <linkId> …');
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`[make-short] ${err.message}`);
    process.exit(1);
  });
}

module.exports = { parseArgs, localExtras };
