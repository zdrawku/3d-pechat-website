// Local gallery editor (foundation #7) — a dev-only maker tool, never deployed.
//
// `npm run gallery-editor` starts this tiny zero-dependency Node server on
// localhost. It serves one page (index.html) that shows each gallery as a
// thumbnail grid with drag-and-drop reordering, alt-text inputs and hide
// toggles. "Save" POSTs the new order back here; the server rewrites the
// folder's manifest.json and re-runs the sync script (generate-carousel-images)
// so carousel-images.ts is regenerated. You then review the git diff and commit.
//
// No auth, no framework: it binds to 127.0.0.1 and is only for the site owner
// on their own machine. It writes ONLY manifest.json files inside the two known
// gallery folders — nothing else on disk is touched.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const PORT = process.env.GALLERY_EDITOR_PORT || 4747;

// The galleries this tool manages. Kept in sync with generate-carousel-images.js.
const GALLERIES = [
  {
    id: 'first-page-images',
    label: 'Начална страница (карусел)',
    dir: path.join(ROOT, 'src/assets/real-images/first-page-images')
  },
  {
    id: 'general-images',
    label: 'Портфолио (галерия)',
    dir: path.join(ROOT, 'src/assets/real-images/general-images')
  }
];

const galleryById = new Map(GALLERIES.map((g) => [g.id, g]));

function isImage(file) {
  return IMAGE_EXTS.includes(path.extname(file).toLowerCase());
}

function readManifest(dir) {
  const p = path.join(dir, 'manifest.json');
  if (!fs.existsSync(p)) return { images: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
    return Array.isArray(parsed.images) ? parsed : { images: [] };
  } catch {
    return { images: [] };
  }
}

// Build the editor's view of a gallery: manifest entries in order, plus any
// on-disk files not yet in the manifest (appended, so nothing is invisible).
function galleryState(gallery) {
  const filesOnDisk = fs.existsSync(gallery.dir)
    ? fs.readdirSync(gallery.dir).filter(isImage)
    : [];
  const onDisk = new Set(filesOnDisk);
  const manifest = readManifest(gallery.dir);
  const known = new Set(manifest.images.map((e) => e.file));

  const ordered = manifest.images
    .filter((e) => onDisk.has(e.file))
    .map((e) => ({ file: e.file, alt: typeof e.alt === 'string' ? e.alt : '', hidden: e.hidden === true }));

  const appended = filesOnDisk
    .filter((f) => !known.has(f))
    .sort()
    .map((file) => ({ file, alt: '', hidden: false }));

  return {
    id: gallery.id,
    label: gallery.label,
    images: [...ordered, ...appended]
  };
}

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const MIME = {
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.gif': 'image/gif', '.html': 'text/html; charset=utf-8'
};

// Persist a gallery's new order/alt/hidden, then regenerate carousel-images.ts.
function saveGallery(galleryId, images, callback) {
  const gallery = galleryById.get(galleryId);
  if (!gallery) return callback(new Error('Unknown gallery: ' + galleryId));

  // Only keep files that actually exist on disk (guards against a stale client).
  const filesOnDisk = new Set(fs.readdirSync(gallery.dir).filter(isImage));
  const clean = images
    .filter((e) => e && typeof e.file === 'string' && filesOnDisk.has(e.file))
    .map((e) => ({
      file: e.file,
      alt: typeof e.alt === 'string' ? e.alt : '',
      hidden: e.hidden === true
    }));

  const manifestPath = path.join(gallery.dir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({ images: clean }, null, 2) + '\n');

  // Re-run the sync script so carousel-images.ts matches the saved manifest.
  execFile(
    process.execPath,
    [path.join(ROOT, 'scripts/generate-carousel-images.js')],
    { cwd: ROOT },
    (err, stdout, stderr) => {
      if (err) return callback(new Error(stderr || err.message));
      callback(null, stdout);
    }
  );
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // API: list all galleries + their current state.
  if (req.method === 'GET' && url.pathname === '/api/galleries') {
    return sendJson(res, 200, { galleries: GALLERIES.map(galleryState) });
  }

  // API: serve a thumbnail image from a known gallery folder.
  if (req.method === 'GET' && url.pathname === '/img') {
    const galleryId = url.searchParams.get('gallery');
    const file = url.searchParams.get('file');
    const gallery = galleryById.get(galleryId);
    // Reject path traversal: filename only, must be a real image in the folder.
    if (!gallery || !file || file !== path.basename(file) || !isImage(file)) {
      res.writeHead(400);
      return res.end('Bad request');
    }
    const filePath = path.join(gallery.dir, file);
    return serveFile(res, filePath, MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
  }

  // API: save a gallery's order/alt/hidden.
  if (req.method === 'POST' && url.pathname === '/api/save') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      let payload;
      try {
        payload = JSON.parse(body);
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON' });
      }
      saveGallery(payload.id, payload.images || [], (err, stdout) => {
        if (err) return sendJson(res, 500, { error: err.message });
        sendJson(res, 200, { ok: true, log: stdout.trim() });
      });
    });
    return;
  }

  // Static: the editor UI.
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    return serveFile(res, path.join(__dirname, 'index.html'), MIME['.html']);
  }

  res.writeHead(404);
  res.end('Not found');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  ✗ Port ${PORT} is already in use.`);
    console.error('    Another gallery-editor instance is probably still running.');
    console.error('    Close it, or start on a different port:\n');
    console.error(`      GALLERY_EDITOR_PORT=4748 npm run gallery-editor\n`);
    console.error('    (To find/stop the process holding the port on Windows:');
    console.error(`      netstat -ano | findstr :${PORT}   →   taskkill /F /PID <pid>)\n`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  🖼  Gallery editor running at  http://localhost:${PORT}\n`);
  console.log('  Reorder (drag or ←/→), caption, and hide images, then Save.');
  console.log('  Saving rewrites manifest.json + regenerates carousel-images.ts.');
  console.log('  Review the git diff and commit. Ctrl+C to stop.\n');
});
