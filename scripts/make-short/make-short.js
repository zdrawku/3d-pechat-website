#!/usr/bin/env node
/**
 * The tool the `/make-short` agent drives (.claude/skills/make-short/SKILL.md),
 * locally and in .github/workflows/make-short.yml. Everything happens in one
 * work folder (default tmp/make-short/local, gitignored):
 *
 *   npm run make-short -- record  --work <dir> --flow <flow.json>     website flow → recordings/<name>.mp4
 *   npm run make-short -- drive   --work <dir> --product <linkId>     product's Drive folder → drive/ (needs GDRIVE_*)
 *   npm run make-short -- prepare --work <dir> [--product <linkId>] [--media <file|dir>]… [--no-catalog]
 *   npm run make-short -- check   --work <dir>                        spec.json: structure + facts
 *   npm run make-short -- render  --work <dir> [--out <dir>]
 *   npm run make-short -- frames  --work <dir> --video <file> --at 1,4.5,9   stills to look at
 *
 * `prepare` writes manifest.json and previews/; the agent looks at the
 * previews and writes spec.json; `render` writes short.mp4, cover.jpg and
 * post.txt to <work>/out (or --out).
 */
const fs = require('fs');
const path = require('path');
const lib = require('./lib');
const media = require('./media');
const { collect, publicMedia } = require('./collect');

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

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const readIf = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '');

function productFrom(query) {
  if (!query) return null;
  const product = lib.findProduct(lib.readProducts(), query);
  if (!product) throw new Error(`No product "${query}" in src/data/products.json (use its linkId or exact name).`);
  return product;
}

/** Files given with --media (a folder means every photo/clip in it), clips first. */
function localExtras(paths) {
  // A folder that doesn't exist (no uploads, nothing recorded) is just empty.
  const files = paths.filter((p) => fs.existsSync(p)).flatMap((p) => (fs.statSync(p).isDirectory()
    ? fs.readdirSync(p).sort().map((f) => path.join(p, f))
    : [p])).filter((f) => media.kindOf(f));
  const origin = (f) => (/[\\/]recordings[\\/]/.test(f) ? 'recording' : /[\\/]drive[\\/]/.test(f) ? 'drive' : /[\\/]uploads[\\/]/.test(f) ? 'upload' : 'local');
  files.sort((a, b) => (media.kindOf(a) === 'video' ? 0 : 1) - (media.kindOf(b) === 'video' ? 0 : 1));
  return files.map((file) => ({ origin: origin(file), ref: path.basename(file), name: path.basename(file), file: path.resolve(file) }));
}

/** spec.json completed from the manifest. */
function loadSpec(work) {
  const manifest = readJson(path.join(work, 'manifest.json'));
  const spec = readJson(path.join(work, 'spec.json'));
  return {
    manifest,
    spec: {
      product: manifest.product,
      ...spec,
      media: publicMedia(manifest),
    },
  };
}

/**
 * Problems with spec.json. Numbers may come from the facts, the product's
 * own text, or the requester's words (request.md).
 */
function check(work) {
  const { spec } = loadSpec(work);
  const product = spec.product ? productFrom(spec.product) : null;
  const sources = [readIf(path.join(work, 'request.md'))];
  if (product) sources.push(product.name, product.description);
  const business = lib.readBusiness();
  const texts = lib.specTexts(spec);
  return [
    ...lib.validateSpec(spec),
    ...lib.factsCheck(texts, { facts: business.facts, sources }),
    ...lib.scopeCheck(texts, { email: business.email }),
  ];
}

/**
 * In CI the agent runs this tool with credentials scrubbed from its
 * environment (CLAUDE_CODE_SUBPROCESS_ENV_SCRUB in make-short.yml). If one
 * ever shows up here, stop rather than run with it.
 */
function refuseCredentials(env = process.env) {
  if (!env.GITHUB_ACTIONS) return;
  const leaked = ['CLAUDE_CODE_OAUTH_TOKEN', 'ANTHROPIC_API_KEY', 'GITHUB_TOKEN', 'GH_TOKEN'].filter((k) => env[k]);
  if (leaked.length) throw new Error(`Refusing to run: ${leaked.join(', ')} reached the shorts tool. Set CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1 on the agent step.`);
}

async function main() {
  refuseCredentials();
  const { cmd, opts } = parseArgs(process.argv.slice(2));
  const work = path.resolve(opts.work || path.join(lib.ROOT, 'tmp', 'make-short', 'local'));
  fs.mkdirSync(work, { recursive: true });

  if (cmd === 'record') {
    const { recordFlow } = require('./record-flow');
    if (!opts.flow) throw new Error('record needs --flow <flow.json>');
    const name = opts.name || path.basename(opts.flow, '.json');
    const result = await recordFlow(readJson(opts.flow), path.join(work, 'recordings'), name);
    console.log(`Recorded ${result.seconds} s → ${path.relative(lib.ROOT, result.video)}`);
    console.log(`Marks (seconds into the recording): ${JSON.stringify(result.marks)}`);
  } else if (cmd === 'drive') {
    const drive = require('./drive');
    const product = productFrom(opts.product);
    if (!product) throw new Error('drive needs --product <linkId>');
    if (!drive.configured()) {
      console.log('Google Drive is not connected (GDRIVE_SA_KEY / GDRIVE_FOLDER_ID missing) — nothing downloaded.');
      return;
    }
    const token = await drive.accessToken(process.env.GDRIVE_SA_KEY);
    const { files, folderName } = await drive.productMedia(token, process.env.GDRIVE_FOLDER_ID, product);
    const dir = path.join(work, 'drive');
    fs.mkdirSync(dir, { recursive: true });
    for (const f of files) await drive.download(token, f.id, path.join(dir, f.name.replace(/[^\p{L}\p{N}._-]+/gu, '_')));
    console.log(folderName
      ? `Downloaded ${files.length} file(s) from Drive folder „${folderName}“ to ${path.relative(lib.ROOT, dir)}.`
      : `No Drive folder named "${product.linkId}" or „${product.name}“ — nothing downloaded.`);
  } else if (cmd === 'prepare') {
    const product = productFrom(opts.product);
    const manifest = await collect({ product, extras: localExtras(opts.media), useCatalog: !opts.noCatalog, workDir: work });
    console.log(`Prepared ${Object.keys(manifest.media).length} media${product ? ` for ${product.name}` : ''} in ${path.relative(lib.ROOT, work)}`);
    for (const [id, m] of Object.entries(manifest.media)) {
      console.log(`  ${id}  ${m.kind}${m.duration ? ` ${m.duration}s ${m.width}x${m.height}` : ''}  ${m.origin}  ${m.name}`);
    }
    console.log('Previews (look at every one before writing spec.json):');
    for (const p of manifest.previews) console.log(`  ${p.id}${p.t !== undefined ? ` @ ${p.t}s` : ''}  ${path.relative(lib.ROOT, p.file)}`);
    for (const w of manifest.warnings) console.log(`  ! ${w}`);
  } else if (cmd === 'check') {
    const problems = check(work);
    if (problems.length) {
      console.log(problems.join('\n'));
      process.exitCode = 1;
    } else console.log('spec.json passes: structure, facts, never-claim and public-text checks.');
  } else if (cmd === 'render') {
    const problems = check(work);
    if (problems.length) throw new Error(`Fix spec.json first:\n${problems.join('\n')}`);
    const { renderShort } = require('./render');
    const { manifest, spec } = loadSpec(work);
    const files = Object.fromEntries(Object.entries(manifest.media).map(([id, m]) => [id, m.file]));
    const outDir = path.resolve(opts.out || path.join(work, 'out'));
    const campaign = `short-${path.basename(work)}`;
    const result = await renderShort({ spec, files, outDir, workDir: path.join(work, 'render'), campaign });
    console.log(`Rendered ${result.seconds} s (captions only, silent):\n  ${result.video}\n  ${result.cover}\n  ${result.post}`);
  } else if (cmd === 'frames') {
    // A local file only: ffmpeg would otherwise fetch whatever URL it is given.
    if (!opts.video || !fs.existsSync(opts.video)) throw new Error('frames needs --video <file> (an existing local file)');
    const dir = path.join(work, 'check');
    fs.mkdirSync(dir, { recursive: true });
    for (const t of String(opts.at || '1').split(',').map(Number)) {
      const out = path.join(dir, `frame-${String(t).replace('.', '_')}s.jpg`);
      media.run('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', opts.video, '-frames:v', '1', '-vf', 'scale=540:-2', out]);
      console.log(`  ${path.relative(lib.ROOT, out)}`);
    }
  } else {
    throw new Error('Usage: make-short.js record|drive|prepare|check|render|frames --work <dir> …');
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`[make-short] ${err.message}`);
    process.exit(1);
  });
}

module.exports = { parseArgs, localExtras, check, refuseCredentials };
