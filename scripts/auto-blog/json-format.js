// JSON in the repo's hand-written layout, so a file the scaffolder rewrites
// (src/i18n/locales.json, src/i18n/<lang>/content/blog.json) changes only
// where its data does: objects one key per line, arrays of plain values on one
// line (["a", "b"]), arrays of objects one object per line ({ "k": "v" }).

const inline = (value) => {
  if (Array.isArray(value)) return `[${value.map(inline).join(', ')}]`;
  if (value && typeof value === 'object') {
    return `{ ${Object.entries(value).map(([k, v]) => `${JSON.stringify(k)}: ${inline(v)}`).join(', ')} }`;
  }
  return JSON.stringify(value);
};

function formatJson(value, indent = '') {
  const inner = `${indent}  `;
  if (Array.isArray(value)) {
    if (value.every((v) => v === null || typeof v !== 'object')) return inline(value);
    return `[\n${value.map((v) => `${inner}${inline(v)}`).join(',\n')}\n${indent}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (!entries.length) return '{}';
    return `{\n${entries.map(([k, v]) => `${inner}${JSON.stringify(k)}: ${formatJson(v, inner)}`).join(',\n')}\n${indent}}`;
  }
  return JSON.stringify(value);
}

/** The file's text for `value`, with a final newline. */
const toJsonFile = (value) => `${formatJson(value)}\n`;

module.exports = { formatJson, toJsonFile };
