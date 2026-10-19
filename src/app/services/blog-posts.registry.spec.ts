import { BLOG_POSTS } from './blog-posts.registry';
import { BLOG_CONTENT } from './blog-content.generated';
import { TRANSLATED_BLOG_CONTENT } from './blog-content.translations.generated';

/**
 * Integrity of the post registry. Every script (sitemap, llms.txt, scaffolder)
 * and SeoService trusts these invariants, so a violation should fail here
 * rather than as a 404 or a malformed sitemap in production.
 */
describe('BLOG_POSTS registry', () => {
  it('has unique ids, slugs and routes', () => {
    for (const key of ['id', 'slug', 'route'] as const) {
      const values = BLOG_POSTS.map(p => p[key]);
      expect(new Set(values).size).withContext(key).toBe(values.length);
    }
  });

  it('routes are /blog/<slug> without a trailing slash (the canonical slash is added at use)', () => {
    for (const post of BLOG_POSTS) {
      expect(post.route).withContext(post.slug).toMatch(/^\/blog\/[a-z0-9-]+$/);
    }
  });

  it('every post has bundled markdown content', () => {
    for (const post of BLOG_POSTS) {
      expect(BLOG_CONTENT[post.slug]).withContext(post.slug).toEqual(jasmine.any(String));
    }
  });

  it('dateModified is never before the publish date', () => {
    for (const post of BLOG_POSTS) {
      if (post.dateModified) {
        expect(post.dateModified.getTime()).withContext(post.slug).toBeGreaterThanOrEqual(post.date.getTime());
      }
    }
  });

  it('every post carries SEO keywords', () => {
    for (const post of BLOG_POSTS) {
      expect(post.keywords?.length).withContext(post.slug).toBeGreaterThan(0);
    }
  });

  it('slugs are at most 80 characters (see slugify)', () => {
    for (const post of BLOG_POSTS) {
      expect(post.slug.length).withContext(post.slug).toBeLessThanOrEqual(80);
    }
  });

  // Bulgaria uses the euro since 1 January 2026: an amount in leva is stale.
  // (Words such as „лев“ for the old coins are fine; amounts are not.)
  it('states every amount in euro, never in leva — in every language', () => {
    const texts = [
      ...Object.entries(BLOG_CONTENT),
      ...Object.entries(TRANSLATED_BLOG_CONTENT).flatMap(([code, posts]) => Object.entries(posts).map(([slug, text]) => [`${code}/${slug}`, text] as const))
    ];
    for (const [slug, text] of texts) {
      expect(text).withContext(slug).not.toMatch(/\d\s*(?:лв\.?|лева)(?![а-я])/i);
      expect(text).withContext(slug).not.toMatch(/\d\s*(?:BGN|leva)\b/i);
    }
  });
});
