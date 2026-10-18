import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';

import { LegacyRedirectComponent } from './legacy-redirect.component';

describe('LegacyRedirectComponent', () => {
  const TO = '/blog/new-post/';
  const REFRESH_SELECTOR = "http-equiv='refresh'";

  /**
   * Meta is stubbed on purpose: a real <meta http-equiv="refresh"> inserted
   * into the Karma page makes Chrome navigate away and aborts the whole run.
   */
  function create(data: Record<string, unknown> = { to: TO }) {
    // getTags/addTag/removeTagElement: SeoService resets og:locale:alternate on every page.
    const meta = jasmine.createSpyObj<Meta>('Meta', ['updateTag', 'removeTag', 'getTags', 'addTag', 'removeTagElement']);
    meta.getTags.and.returnValue([]);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: Meta, useValue: meta },
        { provide: ActivatedRoute, useValue: { snapshot: { data } } }
      ]
    });
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const fixture = TestBed.createComponent(LegacyRedirectComponent);
    fixture.detectChanges();
    return { fixture, router, meta };
  }

  it('sets a zero-delay meta refresh to the absolute new URL', () => {
    const { meta } = create();
    expect(meta.updateTag).toHaveBeenCalledWith(
      { 'http-equiv': 'refresh', content: `0; url=https://3dpechat.bg${TO}` },
      REFRESH_SELECTOR
    );
  });

  it('points the canonical at the new URL', () => {
    create();
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`https://3dpechat.bg${TO}`);
  });

  it('navigates in the browser with replaceUrl', () => {
    const { router } = create();
    expect(router.navigateByUrl).toHaveBeenCalledWith(TO, { replaceUrl: true });
  });

  it('removes the refresh tag when destroyed so later pages are not redirected', () => {
    const { fixture, meta } = create();
    expect(meta.removeTag).not.toHaveBeenCalled();
    fixture.destroy();
    expect(meta.removeTag).toHaveBeenCalledWith(REFRESH_SELECTOR);
  });

  it('renders a crawlable Ignite UI link to the new page', () => {
    const { fixture } = create();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a[igxButton]');
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe(TO.replace(/\/$/, ''));
  });

  it('rejects routes without a target', () => {
    expect(() => create({})).toThrowError(/needs route data/);
  });
});
