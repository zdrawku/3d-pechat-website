/**
 * Read-only access to the shared `3dpechat-shorts` Google Drive folder, as a
 * Google Cloud service account that has Viewer access to that folder only.
 *
 * Service accounts can't create files in a personal Drive, so this module
 * only lists and downloads; finished shorts go back through GitHub.
 *
 * Env (both GitHub secrets):
 *   GDRIVE_SA_KEY    — the service account's JSON key
 *   GDRIVE_FOLDER_ID — the id at the end of the folder's URL
 */
const fs = require('fs');
const crypto = require('crypto');
const { pickProductFolder } = require('./lib');
const { VIDEO_EXT, IMAGE_EXT } = require('./media');

const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const API = 'https://www.googleapis.com/drive/v3';
const FOLDER = 'application/vnd.google-apps.folder';

const b64url = (data) => Buffer.from(data).toString('base64url');

/** A signed JWT exchanged for a one-hour access token (RFC 7523). */
async function accessToken(keyJson) {
  const key = typeof keyJson === 'string' ? JSON.parse(keyJson) : keyJson;
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = key.token_uri || 'https://oauth2.googleapis.com/token';
  const unsigned = `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64url(JSON.stringify({
    iss: key.client_email, scope: SCOPE, aud: tokenUri, iat: now, exp: now + 3600,
  }))}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(key.private_key, 'base64url');
  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: HTTP ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function listChildren(token, folderId) {
  const files = [];
  let pageToken = '';
  do {
    const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const url = `${API}/files?q=${q}&fields=nextPageToken,files(id,name,mimeType,size)&pageSize=200&supportsAllDrives=true&includeItemsFromAllDrives=true${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Drive list failed: HTTP ${res.status} ${await res.text()}`);
    const body = await res.json();
    files.push(...body.files);
    pageToken = body.nextPageToken || '';
  } while (pageToken);
  return files.sort((a, b) => a.name.localeCompare(b.name));
}

async function download(token, fileId, dest) {
  if (!/^[\w-]+$/.test(fileId)) throw new Error(`Bad Drive file id: ${fileId}`);
  const res = await fetch(`${API}/files/${fileId}?alt=media&supportsAllDrives=true`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Drive download failed: HTTP ${res.status}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return dest;
}

/**
 * The product's photos and clips. Returns `{ files, folderName }`;
 * `folderName` is null when the product has no folder yet.
 */
async function productMedia(token, rootId, product) {
  const root = await listChildren(token, rootId);
  const folders = root.filter((f) => f.mimeType === FOLDER);
  const own = pickProductFolder(folders, product);
  const files = own ? (await listChildren(token, own.id)).filter((f) => VIDEO_EXT.test(f.name) || IMAGE_EXT.test(f.name)) : [];
  return { files, folderName: own ? own.name : null };
}

/** True when both secrets are present, so callers can skip Drive cleanly. */
const configured = () => Boolean(process.env.GDRIVE_SA_KEY && process.env.GDRIVE_FOLDER_ID);

module.exports = { accessToken, listChildren, download, productMedia, configured };
