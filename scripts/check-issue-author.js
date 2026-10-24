/**
 * Gate for the issue-form workflows (`add-product.yml`, `make-short.yml`).
 *
 * Anyone can open an issue or comment on a public repo, and the text they
 * write ends up in a build (add-product) or in Claude's prompt (make-short),
 * so only the people in `.github/issue-authors.json` may drive them.
 *
 * The check is on the numeric user id GitHub puts in the event payload. A
 * login can be renamed and later registered by someone else; the id can't.
 *
 * Env:
 *   ACTOR_ID    — github.event.issue.user.id or github.event.comment.user.id
 *   ACTOR_LOGIN — the matching login (only for the log line)
 * Writes `allowed=true|false` and `name=<display name>` to $GITHUB_OUTPUT.
 */
const fs = require('fs');
const path = require('path');

const AUTHORS_FILE = path.join(__dirname, '..', '.github', 'issue-authors.json');

function readAuthors(file = AUTHORS_FILE) {
  const { authors } = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(authors) || authors.some((a) => !Number.isInteger(a.id) || !a.login)) {
    throw new Error(`${file}: every author needs a login and a numeric id`);
  }
  return authors;
}

/** Returns the matching author, or null. Compares ids as numbers only. */
function findAuthor(authors, actorId) {
  const id = Number(actorId);
  if (!Number.isInteger(id) || id <= 0) return null;
  return authors.find((a) => a.id === id) || null;
}

function main() {
  const authors = readAuthors();
  const login = process.env.ACTOR_LOGIN || '(unknown)';
  const author = findAuthor(authors, process.env.ACTOR_ID);

  if (author) {
    console.log(`'${login}' (id ${author.id}) is allowed as ${author.name || author.login}.`);
    if (author.login !== login) {
      console.log(`::warning::Login changed: issue-authors.json says '${author.login}', GitHub says '${login}'. Update the file.`);
    }
  } else {
    console.log(`'${login}' (id ${process.env.ACTOR_ID}) is not in .github/issue-authors.json — refusing to run.`);
  }

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `allowed=${author ? 'true' : 'false'}\nname=${author ? author.name || author.login : ''}\n`
    );
  }
}

if (require.main === module) main();

module.exports = { readAuthors, findAuthor };
