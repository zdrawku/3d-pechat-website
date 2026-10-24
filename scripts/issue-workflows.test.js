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

test('the shorts agent gets no GitHub token and only the shorts tool', { skip: !yaml && 'js-yaml not installed' }, () => {
  const agentStep = steps(load('make-short.yml').jobs.agent).find((s) => /claude -p/.test(s.run || ''));
  assert.ok(agentStep, 'the agent step exists');
  for (const key of Object.keys(agentStep.env || {})) assert.doesNotMatch(key, /GITHUB_TOKEN|GH_TOKEN|ANTHROPIC_API_KEY/, key);
  assert.match(agentStep.run, /--permission-mode dontAsk/);
  assert.match(agentStep.run, /"Bash\(npm run make-short:\*\)"/);
  assert.match(agentStep.run, /--max-budget-usd/);
});
