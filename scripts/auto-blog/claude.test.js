const test = require('node:test');
const assert = require('node:assert');
const { cliArgs, parseCliResult } = require('./claude');

test('headless, text only: JSON output, no tools, one turn, own system prompt', () => {
  const args = cliArgs('sonnet');
  const value = (flag) => args[args.indexOf(flag) + 1];
  assert.strictEqual(args[0], '-p');
  assert.strictEqual(value('--output-format'), 'json');
  assert.strictEqual(value('--tools'), '');
  assert.strictEqual(value('--max-turns'), '1');
  assert.strictEqual(value('--model'), 'sonnet');
  assert.ok(args.includes('--system-prompt'));
});

test('every call carries a spending cap', () => {
  const args = cliArgs('sonnet');
  const cap = Number(args[args.indexOf('--max-budget-usd') + 1]);
  assert.ok(cap > 0 && cap <= 5, `cap ${cap}`);
});

test('hitting the spending cap is reported as such', () => {
  assert.throws(() => parseCliResult('{"type":"result","subtype":"error_max_budget_usd","is_error":true,"result":""}'), /spending cap/);
});

test('returns the text of a successful answer', () => {
  assert.strictEqual(parseCliResult('{"type":"result","subtype":"success","is_error":false,"result":"{\\"ok\\":true}"}'), '{"ok":true}');
});

test('refuses errors, limits and non-JSON output', () => {
  assert.throws(() => parseCliResult('{"type":"result","subtype":"success","is_error":true,"result":"Not logged in"}'), /Not logged in/);
  assert.throws(() => parseCliResult('{"type":"result","subtype":"error_max_turns","is_error":false}'), /error_max_turns/);
  assert.throws(() => parseCliResult('Invalid API key'), /no JSON answer/);
});
