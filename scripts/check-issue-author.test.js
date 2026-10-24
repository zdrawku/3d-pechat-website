const test = require('node:test');
const assert = require('node:assert');
const { readAuthors, findAuthor } = require('./check-issue-author');

test('the allowlist has both owners with numeric ids', () => {
  const authors = readAuthors();
  assert.deepStrictEqual(
    authors.map((a) => [a.login, a.id]),
    [['zdrawku', 11193764], ['mariyajablqnova-ux', 347078913]]
  );
});

test('matches on the numeric id, whether it arrives as a number or a string', () => {
  const authors = readAuthors();
  assert.strictEqual(findAuthor(authors, 11193764).login, 'zdrawku');
  assert.strictEqual(findAuthor(authors, '347078913').login, 'mariyajablqnova-ux');
});

test('refuses unknown, missing and malformed ids', () => {
  const authors = readAuthors();
  for (const id of [1, '', undefined, null, 'zdrawku', '11193764abc', '-11193764', '1.5', 0]) {
    assert.strictEqual(findAuthor(authors, id), null, `id ${id} must not match`);
  }
});
