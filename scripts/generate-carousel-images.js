const fs = require('fs');
const path = require('path');

// Gallery sync script (foundation #2).
//
// Each image folder owns a co-located `manifest.json` that is the SOURCE OF
// TRUTH for display order, per-image `alt` text, and a `hidden` flag. This
// script keeps that manifest in sync with the files actually on disk and then
// regenerates the `carousel-images.ts` the Angular components import.
//
// Sync rules (order is never silently reshuffled):
//   - First run (no manifest): seed it from the folder in alphabetical order,
//     so the live site looks identical to before this system existed.
//   - New files on disk: appended to the END of the manifest (alphabetically
//     among themselves) — never lost, never reordered above existing entries.
//   - Manifest entries whose file was deleted: dropped.
//   - Existing entries: order, alt and hidden are preserved as-authored.
//
// To reorder / hide / caption images, edit `manifest.json` (or use the local
// gallery editor, foundation #7) and re-run `npm run generate-images`.

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const imageFolders = [
    {
        name: 'first-page-images',
        dir: path.join(__dirname, '../src/assets/real-images/first-page-images'),
        output: path.join(__dirname, '../src/app/main-page/carousel-images.ts'),
        exportName: 'carouselImages'
    },
    {
        name: 'general-images',
        dir: path.join(__dirname, '../src/assets/real-images/general-images'),
        output: path.join(__dirname, '../src/app/portfolio-page/carousel-images.ts'),
        exportName: 'carouselImages'
    }
];

function isImage(file) {
    return IMAGE_EXTS.includes(path.extname(file).toLowerCase());
}

function readManifest(manifestPath) {
    if (!fs.existsSync(manifestPath)) {
        return { images: [] };
    }
    try {
        const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        return (parsed && Array.isArray(parsed.images)) ? parsed : { images: [] };
    } catch (err) {
        console.warn(`⚠ Could not parse ${manifestPath} (${err.message}); reseeding.`);
        return { images: [] };
    }
}

// Reconcile the on-disk files with the manifest, returning the synced entry list.
function syncEntries(existingEntries, filesOnDisk) {
    const onDisk = new Set(filesOnDisk);
    const known = new Set(existingEntries.map((e) => e.file));

    // Keep authored entries whose file still exists (preserve order + metadata).
    const kept = existingEntries.filter((e) => onDisk.has(e.file));

    // Append files that aren't in the manifest yet, alphabetically among themselves.
    const added = filesOnDisk
        .filter((f) => !known.has(f))
        .sort()
        .map((file) => ({ file, alt: '', hidden: false }));

    return [...kept, ...added];
}

function normalizeEntry(entry) {
    if (!entry || typeof entry !== 'object') {
        return { file: '', alt: '', hidden: false };
    }
    return {
        file: typeof entry.file === 'string' ? entry.file : '',
        alt: typeof entry.alt === 'string' ? entry.alt : '',
        hidden: entry.hidden === true
    };
}

let totalVisible = 0;

imageFolders.forEach((folder) => {
    try {
        if (!fs.existsSync(folder.dir)) {
            console.warn(`⚠ Warning: Directory not found: ${folder.dir}`);
            return;
        }

        const manifestPath = path.join(folder.dir, 'manifest.json');
        const filesOnDisk = fs.readdirSync(folder.dir).filter(isImage);

        const manifest = readManifest(manifestPath);
        const synced = syncEntries(manifest.images.map(normalizeEntry), filesOnDisk).map(normalizeEntry);

        // Persist the reconciled manifest (created on first run, updated after).
        fs.writeFileSync(manifestPath, JSON.stringify({ images: synced }, null, 2) + '\n');

        // Emit only visible images, in manifest order, as { src, alt }.
        const visible = synced.filter((e) => !e.hidden);
        const items = visible.map((e) => {
            const src = `/assets/real-images/${folder.name}/${e.file}`;
            return `  { src: ${JSON.stringify(src)}, alt: ${JSON.stringify(e.alt)} }`;
        });

        const fileContent = `// This file is auto-generated. Do not edit manually.
// Run 'npm run generate-images' to regenerate it from each folder's manifest.json.

export interface CarouselImage {
  src: string;
  /** Empty string means "no authored alt yet" — the template supplies a fallback. */
  alt: string;
}

export const ${folder.exportName}: CarouselImage[] = [
${items.join(',\n')}
];
`;

        fs.writeFileSync(folder.output, fileContent);
        const hiddenCount = synced.length - visible.length;
        console.log(
            `✓ ${folder.name}: ${visible.length} visible` +
            (hiddenCount ? `, ${hiddenCount} hidden` : '') +
            ` (manifest synced)`
        );
        totalVisible += visible.length;
    } catch (err) {
        console.error(`✗ Error processing ${folder.name}:`, err.message);
        process.exit(1);
    }
});

console.log(`\n✓ Total: ${totalVisible} visible images across ${imageFolders.length} carousels`);
