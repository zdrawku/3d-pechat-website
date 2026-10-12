import { BlogPost } from '../../models/blog-post.model';
import { Product } from '../../models/product.model';

/**
 * Picks the „Продължете да четете" / „Може да ви хареса" items for a blog post.
 *
 * Fully automatic — no hand-maintained "related" lists to forget when the
 * auto-blog adds a post. Matching works on word *stems* (first 5 letters of each
 * word, lower-cased) so Bulgarian inflections line up: „подарък" / „подаръци",
 * „литофан" / „литофани".
 */

const STEM_LENGTH = 5;
const MIN_WORD_LENGTH = 4;

/**
 * Words every post and product shares, so matching on them says nothing
 * („3D принтиране" is in every post's tags; „3D принтирана стойка" would match
 * every product). Stems, not words.
 */
const GENERIC_STEMS = new Set([
  'принт', 'печат', 'филам', 'модел', 'техно', 'като', 'може', 'как', 'какво',
  'ръково', 'съвет', 'прак', 'начин', 'пълно', 'полу', 'нашит', 'вашит',
  'услуг', 'проек', 'идеи', 'изб'
]);

/** Lower-cased stems of every meaningful word in the given texts. */
export function stems(...texts: (string | undefined)[]): Set<string> {
  const out = new Set<string>();
  for (const text of texts) {
    for (const word of (text ?? '').toLowerCase().split(/[^\p{L}\p{N}+]+/u)) {
      if (word.length < MIN_WORD_LENGTH) {
        continue;
      }
      const stem = word.slice(0, STEM_LENGTH);
      if (!GENERIC_STEMS.has(stem)) {
        out.add(stem);
      }
    }
  }
  return out;
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const s of a) {
    if (b.has(s)) {
      n++;
    }
  }
  return n;
}

/** Newest first; ties broken by id so the result is stable across builds. */
function byDateDesc(a: BlogPost, b: BlogPost): number {
  return b.date.getTime() - a.date.getTime() || Number(b.id) - Number(a.id);
}

/**
 * The `limit` posts that share the most tags/title words with `current`,
 * topped up with the newest posts when too few overlap. Never includes
 * `current` itself.
 */
export function pickRelatedPosts(current: BlogPost, all: BlogPost[], limit = 3): BlogPost[] {
  const mine = stems(...(current.tags ?? []), current.title);
  const candidates = all.filter((p) => p.slug !== current.slug);

  const scored = candidates.map((post) => ({
    post,
    // Shared tags count double: they were chosen on purpose, title words are incidental.
    score: 2 * overlap(stems(...(post.tags ?? [])), mine) + overlap(stems(post.title), mine)
  }));

  scored.sort((a, b) => b.score - a.score || byDateDesc(a.post, b.post));
  return scored.slice(0, limit).map((s) => s.post);
}

/** Products that are the same item in several variants share their tag set. */
function variantKey(product: Product): string {
  return [...(product.tags ?? [])].sort().join('|') || product.name;
}

/**
 * The `limit` catalog products that best fit `post`, at most one per product
 * *family* (e.g. the five coin-card variants count once) so the row isn't three
 * near-identical cards. Posts with nothing in common with the catalog get the
 * newest products instead of an empty block.
 */
export function pickRelatedProducts(post: BlogPost, products: Product[], limit = 3): Product[] {
  const mine = stems(...(post.tags ?? []), post.title, post.description);

  const scored = products
    .filter((p) => !!p.frontImage)
    .map((product) => ({
      product,
      // Tags and name only — descriptions are too chatty („3D принтирана…").
      score: overlap(stems(...(product.tags ?? []), product.name), mine)
    }));

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      (b.product.dateAdded ?? '').localeCompare(a.product.dateAdded ?? '') ||
      b.product.id - a.product.id
  );

  const seen = new Set<string>();
  const picked: Product[] = [];
  for (const { product } of scored) {
    const key = variantKey(product);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    picked.push(product);
    if (picked.length === limit) {
      break;
    }
  }
  return picked;
}
