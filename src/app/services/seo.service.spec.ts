import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { SeoService } from './seo.service';

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
});
