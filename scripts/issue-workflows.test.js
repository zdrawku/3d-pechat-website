// Guards the guards: the two issue-form workflows may only do work for the
// people in .github/issue-authors.json, the Claude token is reachable only
// from `main`, and no workflow writes to `main` without a review. These tests
// read the workflow files, so a later edit can't quietly drop a check.
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

// The photos are files anyone on the allowlist pasted or dropped in; the
// steps that download and decode them must have no token to give away.
test('📦 Нов продукт: no token reaches the photo download, and a failure is explained on the issue', { skip: !yaml && 'js-yaml not installed' }, () => {
  const job = load('add-product.yml').jobs['add-product'];
  const checkout = steps(job).find((s) => /actions\/checkout/.test(s.uses || ''));
  assert.strictEqual(checkout.with && checkout.with['persist-credentials'], false);
  const add = steps(job).find((s) => /node scripts\/add-product\/from-issue\.js/.test(s.run || ''));
  assert.deepStrictEqual(Object.keys(add.env), ['ISSUE_BODY']);
  const explain = steps(job).find((s) => s.if === 'failure()');
  assert.ok(explain, 'a failure step comments on the issue');
  assert.strictEqual(explain.env.REASON, '${{ steps.add.outputs.error }}');
  assert.match(explain.run, /gh issue comment "\$ISSUE"/);
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
  // Only the Claude token (the shorts tool drops it before starting anything).
  assert.deepStrictEqual(Object.keys(agentStep.env).sort(), ['CLAUDE_CODE_OAUTH_TOKEN', 'CLAUDE_CODE_SUBPROCESS_ENV_SCRUB']);
  // The sandbox is a switch, and explicitly off unless switched on.
  assert.strictEqual(agentStep.env.CLAUDE_CODE_SUBPROCESS_ENV_SCRUB, "${{ vars.SHORTS_SANDBOX == 'true' && '1' || '0' }}");
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

test('both issue-form flows start only for a new issue from their form, by the team', { skip: !yaml && 'js-yaml not installed' }, () => {
  for (const [file, gateJob, form, output] of [
    ['add-product.yml', 'check-owner', 'new-product.yml', 'is_owner'],
    ['make-short.yml', 'gate', 'new-short.yml', 'allowed'],
  ]) {
    const wf = load(file);
    // A label added to some other issue later must not start anything.
    assert.deepStrictEqual(wf.on.issues.types, ['opened'], file);
    const template = steps(wf.jobs[gateJob]).find((s) => /node scripts\/check-issue-template\.js/.test(s.run || ''));
    assert.ok(template, `${file}: checks the form`);
    assert.strictEqual(template.env.TEMPLATE, form, file);
    assert.strictEqual(template.env.ISSUE_BODY, '${{ github.event.issue.body }}', file);
    assert.match(wf.jobs[gateJob].outputs[output], /steps\.verify\.outputs\.allowed == 'true'/, file);
    assert.match(wf.jobs[gateJob].outputs[output], /steps\.template\.outputs\.template == 'true'/, file);
  }
});

const allWorkflows = () => fs.readdirSync(path.join(__dirname, '..', '.github', 'workflows'))
  .filter((f) => /\.ya?ml$/.test(f)).map((f) => [f, load(f)]);

// Anyone with write access can push a workflow on a branch and read every
// repo-level secret. The `claude` environment only serves `main`.
test('only jobs in the main-only `claude` environment get the Claude token', { skip: !yaml && 'js-yaml not installed' }, () => {
  let users = 0;
  for (const [file, wf] of allWorkflows()) {
    for (const [name, job] of Object.entries(wf.jobs)) {
      if (!JSON.stringify(job).includes('secrets.CLAUDE_CODE_OAUTH_TOKEN')) continue;
      users += 1;
      const env = typeof job.environment === 'string' ? job.environment : job.environment && job.environment.name;
      assert.strictEqual(env, 'claude', `${file} → ${name}`);
    }
  }
  assert.strictEqual(users, 2, 'make-short agent + auto-blog');
});

// „Re-run“ repeats a job with the first attempt's event (and skips the
// gate), started by whoever clicks it — anyone with write access.
test('every job with the Claude token checks who started this attempt before using it', { skip: !yaml && 'js-yaml not installed' }, () => {
  let checked = 0;
  for (const [file, wf] of allWorkflows()) {
    for (const [name, job] of Object.entries(wf.jobs)) {
      if (job.environment !== 'claude') continue;
      const all = steps(job);
      const who = all.findIndex((s) => /github\.triggering_actor/.test(JSON.stringify(s.env || {})) && /REQUIRE_ALLOWED=1 node scripts\/check-issue-author\.js/.test(s.run || ''));
      const usesToken = all.findIndex((s) => JSON.stringify(s).includes('secrets.CLAUDE_CODE_OAUTH_TOKEN'));
      assert.ok(who !== -1 && who < usesToken, `${file} → ${name}: verify github.triggering_actor before the Claude step`);
      checked += 1;
    }
  }
  assert.strictEqual(checked, 2);
});

test('🎬 a stranger can\'t bump a waiting request, and a refused re-run posts nothing', { skip: !yaml && 'js-yaml not installed' }, () => {
  const wf = load('make-short.yml');
  assert.strictEqual(wf.concurrency, undefined, 'no workflow-level queue: every comment\'s run would share it');
  assert.match(wf.jobs.agent.concurrency.group, /make-short-\$\{\{ github\.event\.issue\.number \}\}/);
  assert.strictEqual(wf.jobs.agent.concurrency['cancel-in-progress'], false);
  const fail = steps(wf.jobs.agent).find((s) => /from-issue\.js fail/.test(s.run || ''));
  assert.match(fail.if, /steps\.who\.outcome == 'success'/);
});

test('every workflow states its token permissions, and none pushes to a branch itself', { skip: !yaml && 'js-yaml not installed' }, () => {
  for (const [file, wf] of allWorkflows()) {
    const jobs = Object.entries(wf.jobs);
    assert.ok(wf.permissions || jobs.every(([, job]) => job.permissions), `${file}: add a permissions block`);
    for (const [name, job] of jobs) {
      for (const s of steps(job)) assert.doesNotMatch(s.run || '', /git push/, `${file} → ${name}: open a PR instead (main only takes reviewed changes)`);
    }
  }
});

test('🎬 only the team\'s „Качено“ closes the issue, and it never starts the agent', { skip: !yaml && 'js-yaml not installed' }, () => {
  const wf = load('make-short.yml');
  const kind = steps(wf.jobs.gate).find((s) => s.id === 'kind');
  assert.match(kind.run, /isUploadedNote\(process\.env\.BODY\)/);
  assert.strictEqual(kind.env.BODY, '${{ github.event.comment.body }}');
  // Classified only after the commenter AND the issue's author passed the allowlist.
  assert.match(kind.if, /steps\.verify\.outputs\.allowed == 'true' && steps\.verify_issue\.outputs\.allowed == 'true'/);
  assert.match(wf.jobs.published.if, /needs\.gate\.outputs\.allowed == 'true' && needs\.gate\.outputs\.uploaded == 'true'/);
  assert.match(steps(wf.jobs.published)[0].run, /gh issue close "\$ISSUE" --repo "\$REPO" --reason completed/);
  // A „Качено“ note never makes a version or a limit message.
  assert.match(wf.jobs.agent.if, /needs\.gate\.outputs\.uploaded != 'true'/);
  assert.match(steps(wf.jobs.gate).find((s) => s.id === 'limits').if, /steps\.kind\.outputs\.uploaded != 'true'/);
});

// Text anyone can write (titles, bodies, comments) must reach a script only
// through `env:` — `${{ … }}` inside `run:` is pasted into the shell first.
test('no workflow pastes issue or comment text into a shell script', { skip: !yaml && 'js-yaml not installed' }, () => {
  for (const [file, wf] of allWorkflows()) {
    for (const [name, job] of Object.entries(wf.jobs)) {
      for (const s of steps(job)) {
        assert.doesNotMatch(s.run || '', /\$\{\{[^}]*github\.event\.(comment|issue|pull_request|review)\.(body|title)/, `${file} → ${name} → ${s.name || s.uses}`);
      }
    }
  }
});

test('when the sandbox is switched on, bubblewrap is installed and checked before the agent starts', { skip: !yaml && 'js-yaml not installed' }, () => {
  const job = load('make-short.yml').jobs.agent;
  const all = steps(job);
  const install = all.findIndex((s) => /apt-get install[^\n]*bubblewrap/.test(s.run || ''));
  const agent = all.findIndex((s) => /claude -p/.test(s.run || ''));
  assert.ok(install !== -1 && install < agent, 'bubblewrap is installed before the agent step');
  assert.strictEqual(all[install].if, "vars.SHORTS_SANDBOX == 'true'", 'same switch as CLAUDE_CODE_SUBPROCESS_ENV_SCRUB');
  assert.match(all[install].run, /apparmor_restrict_unprivileged_userns=0/);
  assert.match(all[install].run, /bwrap .*--unshare-user/);
});

test('the shorts tool itself drops credentials before it starts anything', () => {
  const src = fs.readFileSync(path.join(__dirname, 'make-short', 'make-short.js'), 'utf8');
  assert.match(src, /async function main\(\) \{\n\s+dropCredentials\(\);/, 'first thing main() does');
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
