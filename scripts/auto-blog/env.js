// Loads the repo's .env when running locally (a no-op in CI, where env vars
// come from secrets). Existing variables win over the file.

const fs = require('fs');
const path = require('path');

function loadEnv(file = path.resolve(__dirname, '../../.env')) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

module.exports = { loadEnv };
