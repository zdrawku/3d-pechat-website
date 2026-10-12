import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { SeoService } from './seo.service';
import { BLOG_POSTS } from './blog-posts.registry';

/**
 * Unit tests for SeoService — the meta-tag/title/canonical logic that protects
 * indexing. Runs under the current Angular test runner (Karma). When the Vitest
 * migration lands (see e2e/README "Pending"), these specs carry over unchanged.
 */
describe('SeoService', () => {
  let service: SeoService;
  let title: Title;
  let meta: Meta;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeoService);
    title = TestBed.inject(Title);
    meta = TestBed.inject(Meta);
  });

  it('sets the document title', () => {
    service.updateSeo({ title: 'Test Title', description: 'Desc' });
    expect(title.getTitle()).toBe('Test Title');
  });

  it('sets description on name, og, and twitter tags', () => {
    service.updateSeo({ title: 'T', description: 'My description' });
    expect(meta.getTag('name="description"')?.content).toBe('My description');
    expect(meta.getTag('property="og:description"')?.content).toBe('My description');
    expect(meta.getTag('name="twitter:description"')?.content).toBe('My description');
  });

  it('falls back to the default OG image when none is provided', () => {
    service.updateSeo({ title: 'T', description: 'D' });
    expect(meta.getTag('property="og:image"')?.content).toContain('og-image.png');
  });

  it('uses a provided image over the default', () => {
    service.updateSeo({ title: 'T', description: 'D', image: 'https://x/y.png' });
    expect(meta.getTag('property="og:image"')?.content).toBe('https://x/y.png');
  });

  it('writes a canonical link when a url is provided', () => {
    service.updateSeo({ title: 'T', description: 'D', url: 'https://3dpechat.bg/test/' });
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe('https://3dpechat.bg/test/');
  });

  it('adds and removes JSON-LD structured data', () => {
    service.setStructuredData({ '@type': 'Organization', name: 'X' });
    const script = document.getElementById('structured-data-jsonld');
    expect(script).toBeTruthy();
    expect(script?.textContent).toContain('Organization');

    service.removeStructuredData();
    expect(document.getElementById('structured-data-jsonld')).toBeNull();
  });

  describe('applyBlogPostSeo', () => {
    const SLUG = 'kak-da-pechelim-ot-3d-printiraneto';
    const URL = 'https://3dpechat.bg/blog/kak-da-pechelim-ot-3d-printiraneto/';
    const graph = (): any[] =>
      JSON.parse(document.getElementById('structured-data-jsonld')!.textContent!)['@graph'];

    afterEach(() => service.removeStructuredData());

    it('sets meta, canonical (with trailing slash) and og:type article from the registry', () => {
      const post = BLOG_POSTS.find(p => p.slug === SLUG)!;
      service.applyBlogPostSeo(SLUG);

      expect(title.getTitle()).toBe(`${post.title} | 3D Печат България`);
      expect(meta.getTag('name="description"')?.content).toBe(post.description);
      expect(meta.getTag('property="og:type"')?.content).toBe('article');
      expect(meta.getTag('property="og:url"')?.content).toBe(URL);
      expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(URL);
      expect(meta.getTag('name="keywords"')?.content).toBe(post.keywords!.join(', '));
      expect(meta.getTag('property="article:modified_time"')?.content).toBe(post.dateModified!.toISOString());
    });

    it('uses the registry seoTitle verbatim when a post defines one', () => {
      const post = BLOG_POSTS.find(p => p.seoTitle)!;
      service.applyBlogPostSeo(post.slug);
      expect(title.getTitle()).toBe(post.seoTitle!);
    });

    it('emits BlogPosting and BreadcrumbList in a single @graph', () => {
      service.applyBlogPostSeo(SLUG);

      expect(document.querySelectorAll('script[type="application/ld+json"]#structured-data-jsonld').length).toBe(1);
      const types = graph().map(node => node['@type']);
      expect(types).toEqual(['BlogPosting', 'BreadcrumbList']);

      const posting = graph()[0];
      expect(posting.mainEntityOfPage['@id']).toBe(URL);
      expect(posting.dateModified).toBe(BLOG_POSTS.find(p => p.slug === SLUG)!.dateModified!.toISOString());
      expect(posting.image).toMatch(/^https:\/\/3dpechat\.bg\//);

      const crumbs = graph()[1].itemListElement;
      expect(crumbs.map((c: any) => c.item)).toEqual(['https://3dpechat.bg/', 'https://3dpechat.bg/blog/', URL]);
      expect(crumbs.map((c: any) => c.position)).toEqual([1, 2, 3]);
    });

    it('works for every registered post', () => {
      for (const post of BLOG_POSTS) {
        service.applyBlogPostSeo(post.slug);
        expect(graph()[0].headline).withContext(post.slug).toBe(post.title);
        expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href'))
          .withContext(post.slug)
          .toMatch(/^https:\/\/3dpechat\.bg\/blog\/[a-z0-9-]+\/$/);
      }
    });

    it('throws for an unknown slug so a typo fails the prerender', () => {
      expect(() => service.applyBlogPostSeo('no-such-post')).toThrowError(/no post with slug/);
    });
  });
});
