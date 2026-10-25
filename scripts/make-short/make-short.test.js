const test = require('node:test');
const assert = require('node:assert');
const { dropCredentials } = require('./make-short');

test('the tool drops every credential before it starts ffmpeg or Chromium', () => {
  const env = {
    PATH: '/usr/bin', HOME: '/home/runner', GDRIVE_FOLDER_ID: 'x',
    CLAUDE_CODE_OAUTH_TOKEN: 'a', ANTHROPIC_API_KEY: 'b', ANTHROPIC_AUTH_TOKEN: 'c', GITHUB_TOKEN: 'd', GH_TOKEN: 'e',
  };
  dropCredentials(env);
  assert.deepStrictEqual(env, { PATH: '/usr/bin', HOME: '/home/runner', GDRIVE_FOLDER_ID: 'x' });
});

test('what the tool starts really inherits none of them', () => {
  const { spawnSync } = require('child_process');
  const script = `require(${JSON.stringify(require.resolve('./make-short'))}).dropCredentials();
    console.log(require('child_process').execFileSync(process.execPath, ['-e', 'console.log(Boolean(process.env.CLAUDE_CODE_OAUTH_TOKEN || process.env.GH_TOKEN))']).toString().trim());`;
  const out = spawnSync(process.execPath, ['-e', script], { env: { ...process.env, CLAUDE_CODE_OAUTH_TOKEN: 'secret', GH_TOKEN: 'secret' } });
  assert.strictEqual(out.stdout.toString().trim(), 'false', out.stderr.toString());
});
