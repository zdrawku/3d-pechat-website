const test = require('node:test');
const assert = require('node:assert');
const { refuseCredentials } = require('./make-short');

test('in CI the tool refuses to run when a credential reached it', () => {
  assert.throws(() => refuseCredentials({ GITHUB_ACTIONS: 'true', CLAUDE_CODE_OAUTH_TOKEN: 'x' }), /CLAUDE_CODE_OAUTH_TOKEN/);
  assert.throws(() => refuseCredentials({ GITHUB_ACTIONS: 'true', GH_TOKEN: 'x' }), /GH_TOKEN/);
  assert.doesNotThrow(() => refuseCredentials({ GITHUB_ACTIONS: 'true' }));
  // Locally your own login is fine.
  assert.doesNotThrow(() => refuseCredentials({ CLAUDE_CODE_OAUTH_TOKEN: 'x' }));
});
