// One prompt in, one text out — through Claude Code in headless mode
// (`claude -p`), on whatever the CLI is signed in with: your own login when
// run locally, a repo secret in the auto-blog workflow. No API key needed.
//
// The prompt goes in on stdin (articles are long), the CLI runs in the temp
// folder with no tools and no MCP servers, so the repo's own instructions and
// files (and, locally, your connected accounts) stay out of the writing, and
// `--output-format json` tells success from failure.

const os = require('os');
const { spawn } = require('child_process');

const MODEL = process.env.ANTHROPIC_MODEL || 'sonnet';
const BIN = process.env.CLAUDE_BIN || 'claude';
const SYSTEM = 'You are a careful Bulgarian/English copywriter for a 3D-printing workshop. Follow the instructions in the input exactly and reply with only the requested output.';

// Hard caps per call, so one bad request can't eat the subscription: an
// estimated spend (Claude Code stops past it) and wall-clock time (killed).
// A normal article or translation stays well under both.
const MAX_BUDGET_USD = process.env.CLAUDE_MAX_BUDGET_USD || '1';
const TIMEOUT_MS = Number(process.env.CLAUDE_TIMEOUT_MIN || 10) * 60 * 1000;

/** CLI arguments; exported for the test. */
function cliArgs(model = MODEL) {
  return [
    '-p', 'Follow the instructions in the input exactly and reply with only the requested output.',
    '--output-format', 'json',
    '--tools', '',
    '--strict-mcp-config',
    '--system-prompt', SYSTEM,
    '--max-turns', '1',
    '--max-budget-usd', String(MAX_BUDGET_USD),
    '--model', model,
  ];
}

/** Reads the CLI's JSON answer; throws with its message when it failed. */
function parseCliResult(stdout) {
  let result;
  try {
    result = JSON.parse(stdout);
  } catch {
    throw new Error(`Claude Code gave no JSON answer: ${String(stdout).slice(0, 300)}`);
  }
  if (result.subtype === 'error_max_budget_usd') {
    throw new Error(`stopped at the per-call spending cap (${MAX_BUDGET_USD} USD estimated) — nothing was written`);
  }
  if (result.is_error || result.subtype !== 'success' || typeof result.result !== 'string') {
    throw new Error(`Claude Code failed (${result.subtype || 'unknown'}): ${String(result.result || '').slice(0, 300)}`);
  }
  return result.result;
}

// npm installs `claude` as a .cmd shim on Windows, which only runs through a
// shell; the arguments are fixed strings, so quoting them is enough. Anything
// cmd.exe would still act on inside quotes is refused rather than escaped.
const quote = (a) => {
  const s = String(a);
  if (/["\\%!\r\n]/.test(s)) throw new Error(`argument not safe for the Windows shell: ${s}`);
  return `"${s}"`;
};

/** Sends `prompt` and resolves with Claude's text answer. */
function askClaude(prompt, { label = 'claude', model = MODEL } = {}) {
  const args = cliArgs(model);
  const windows = process.platform === 'win32';
  return new Promise((resolve, reject) => {
    const child = windows
      ? spawn([BIN, ...args.map(quote)].join(' '), { cwd: os.tmpdir(), shell: true })
      : spawn(BIN, args, { cwd: os.tmpdir() });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      err += `\nstopped after ${TIMEOUT_MS / 60000} minutes (time cap)`;
      child.kill();
    }, TIMEOUT_MS);
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(new Error(`[${label}] could not start Claude Code (${BIN}): ${e.message}. Install it with npm i -g @anthropic-ai/claude-code and sign in.`));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      try {
        const text = parseCliResult(out);
        const cost = JSON.parse(out).total_cost_usd;
        if (typeof cost === 'number') console.log(`[${label}] done — estimated ${cost.toFixed(2)} USD of the ${MAX_BUDGET_USD} USD cap`);
        resolve(text);
      } catch (e) {
        reject(new Error(`[${label}] ${e.message}${code ? ` (exit ${code})` : ''}${err ? `\n${err.slice(0, 500)}` : ''}`));
      }
    });
    child.stdin.end(prompt, 'utf8');
  });
}

module.exports = { askClaude, cliArgs, parseCliResult, MODEL };
