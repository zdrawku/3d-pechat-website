/**
 * Gathers a short's media into a work folder: the product's catalog photos
 * plus any extra photos and clips (an issue's attachments, the Drive folder,
 * local files). Each gets an id (m1, m2…), clips get probed and sampled, and
 * everything gets a small preview for Claude. Writes `manifest.json`:
 *   { product, media: { m1: { kind, origin, ref, name, file, duration?, width?, height? } },
 *     previews: [{ id, t?, file }], warnings: [] }
 */
const fs = require('fs');
const path = require('path');
const lib = require('./lib');
const media = require('./media');

/** Extra media beyond this many are left out (Claude sees every preview). */
const MAX_MEDIA = 10;

/** The catalog's front and back photos, as media entries. */
function catalogMedia(product) {
  return [product.frontImage, product.backImage].filter(Boolean).map((src, i) => ({
    origin: 'catalog',
    ref: path.posix.join('src', src.replace(/^\//, '')),
    name: i === 0 ? 'снимка от каталога (лице)' : 'снимка от каталога (гръб)',
  }));
}

/**
 * @param product  products.json entry
 * @param extras   [{ origin, ref, name, file }] already on disk (clips first is best)
 * @param useCatalog include the catalog photos (default true)
 */
async function collect({ product, extras = [], useCatalog = true, workDir }) {
  const previewsDir = path.join(workDir, 'previews');
  fs.mkdirSync(previewsDir, { recursive: true });
  const warnings = [];

  let entries = [
    ...extras,
    ...(useCatalog ? catalogMedia(product).map((e) => ({ ...e, file: path.join(lib.ROOT, e.ref) })) : []),
  ];
  if (extras.length > MAX_MEDIA) {
    warnings.push(`Използвах първите ${MAX_MEDIA} от ${extras.length} файла.`);
    entries = [...extras.slice(0, MAX_MEDIA), ...entries.slice(extras.length)];
  }

  const manifest = { product: product.linkId, media: {}, previews: [], warnings };
  let n = 0;
  for (const e of entries) {
    const kind = media.kindOf(e.file);
    if (!kind) {
      warnings.push(`Пропуснах „${e.name}“: не е снимка или видео.`);
      continue;
    }
    const id = `m${++n}`;
    try {
      if (kind === 'video') {
        const info = media.probe(e.file);
        manifest.media[id] = { kind, origin: e.origin, ref: e.ref, name: e.name, file: e.file, ...info, duration: Math.round(info.duration * 10) / 10 };
        for (const f of media.extractFrames(e.file, info.duration, previewsDir, id)) manifest.previews.push({ id, t: f.t, file: f.file });
      } else {
        manifest.media[id] = { kind, origin: e.origin, ref: e.ref, name: e.name, file: e.file };
        manifest.previews.push({ id, file: await media.photoPreview(e.file, path.join(previewsDir, `${id}.jpg`)) });
      }
    } catch (err) {
      delete manifest.media[id];
      warnings.push(`Пропуснах „${e.name}“: не успях да го отворя (${String(err.message).split('\n')[0]}).`);
    }
  }
  fs.writeFileSync(path.join(workDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}

/** The spec's media list: the manifest without local paths (it travels in a comment). */
const publicMedia = (manifest) => Object.fromEntries(Object.entries(manifest.media).map(([id, m]) => {
  const { file, ...rest } = m;
  return [id, rest];
}));

module.exports = { collect, catalogMedia, publicMedia, MAX_MEDIA };
