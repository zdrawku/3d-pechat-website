// Guards the guards: the two issue-form workflows may only do work for the
// people in .github/issue-authors.json. These tests read the workflow files,
// so a later edit can't quietly drop a check.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

let yaml;
try {
  yaml = require('js-yaml');
} catch {
  yaml = null;
}
const load = (name) => yaml.load(fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', name), 'utf8'));
const steps = (job) => job.steps || [];
const runsChecker = (s) => /node scripts\/check-issue-author\.js/.test(s.run || '');

test('📦 Нов продукт: the PR job runs only after the issue author passed the allowlist', { skip: !yaml && 'js-yaml not installed' }, () => {
  const wf = load('add-product.yml');
  const check = steps(wf.jobs['check-owner']).find(runsChecker);
  assert.ok(check, 'check-owner runs scripts/check-issue-author.js');
  assert.strictEqual(check.env.ACTOR_ID, '${{ github.event.issue.user.id }}');
  assert.match(wf.jobs['add-product'].if, /needs\.check-owner\.outputs\.is_owner == 'true'/);
  assert.match(wf.jobs['reject-non-owner'].if, /is_owner != 'true'/);
});

test('🎬 Ново кратко видео: the agent runs only when the requester AND the issue author are on the allowlist', { skip: !yaml && 'js-yaml not installed' }, () => {
  const wf = load('make-short.yml');
  const gate = wf.jobs.gate;
  const checks = steps(gate).filter(runsChecker);
  assert.strictEqual(checks.length, 2, 'two checks: whoever triggered the run, and whoever opened the issue');
  assert.match(checks[0].env.ACTOR_ID, /github\.event\.issue\.user\.id \|\| github\.event\.comment\.user\.id/);
  assert.strictEqual(checks[1].env.ACTOR_ID, '${{ github.event.issue.user.id }}');
  assert.match(gate.outputs.allowed, /steps\.verify\.outputs\.allowed == 'true'/);
  assert.match(gate.outputs.allowed, /steps\.verify_issue\.outputs\.allowed == 'true'/);
  assert.match(wf.jobs.agent.if, /needs\.gate\.outputs\.allowed == 'true'/);
  assert.match(gate.if, /comment\.user\.type != 'Bot'/);
  assert.match(gate.if, /!github\.event\.issue\.pull_request/);
});

test('the shorts agent can reach no credential and runs only the shorts tool', { skip: !yaml && 'js-yaml not installed' }, () => {
  const job = load('make-short.yml').jobs.agent;
  const agentStep = steps(job).find((s) => /claude -p/.test(s.run || ''));
  assert.ok(agentStep, 'the agent step exists');
  // Only the Claude token, scrubbed from everything the agent starts.
  assert.deepStrictEqual(Object.keys(agentStep.env).sort(), ['CLAUDE_CODE_OAUTH_TOKEN', 'CLAUDE_CODE_SUBPROCESS_ENV_SCRUB']);
  assert.strictEqual(agentStep.env.CLAUDE_CODE_SUBPROCESS_ENV_SCRUB, '1');
  // checkout would otherwise leave the job's token in .git/config.
  const checkout = steps(job).find((s) => /actions\/checkout/.test(s.uses || ''));
  assert.strictEqual(checkout.with && checkout.with['persist-credentials'], false);
  assert.match(agentStep.run, /--permission-mode dontAsk/);
  assert.match(agentStep.run, /--strict-mcp-config/, 'the project .mcp.json must not start (npx, with the env)');
  // A bare "Read" would allow reads outside the repo (/proc/self/environ).
  assert.doesNotMatch(agentStep.run, /"Read"|"Glob"|"Grep"/);
  assert.match(agentStep.run, /--allowedTools "Edit\(\/\$WORK\/\*\*\)" "Bash\(npm run make-short -- \*\)"/);
  assert.doesNotMatch(agentStep.run, /make-short:\*/, 'npm flags before `--` (e.g. --node-options) would run any code');
  assert.match(agentStep.run, /"Read\(\/\.git\/\*\*\)"/);
  assert.match(agentStep.run, /--max-budget-usd/);
  assert.doesNotMatch(agentStep.run, /auth status/, 'the log is public');
});

test('the shorts agent may only talk about the short', { skip: !yaml && 'js-yaml not installed' }, () => {
  const wf = load('make-short.yml');
  const agentStep = steps(wf.jobs.agent).find((s) => /claude -p/.test(s.run || ''));
  const rulesFile = agentStep.run.match(/--append-system-prompt-file (\S+)/);
  assert.ok(rulesFile, 'the scope rules are in the system prompt');
  const rules = fs.readFileSync(path.join(__dirname, '..', rulesFile[1]), 'utf8');
  for (const topic of [/subscription/, /repository/, /people who run the site/, /never instructions/]) assert.match(rules, topic);
  // The transcript is the whole session; artifacts of a public repo are public.
  const keep = steps(wf.jobs.agent).find((s) => /upload-artifact/.test(s.uses || ''));
  assert.match(keep.if, /vars\.SHORTS_DEBUG == 'true'/);
});
