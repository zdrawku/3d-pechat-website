import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AnalyticsService, SEARCH_PAUSE_MS } from './analytics.service';
import { ConsentService } from './consent.service';

type GtagWindow = Window & { gtag?: jasmine.Spy };

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let gtag: jasmine.Spy;
  let host: HTMLElement;
  /** Keeps the test page from following the links it clicks (tel:, /contact/ …). */
  const stayOnPage = (event: Event) => event.preventDefault();

  beforeEach(() => {
    gtag = jasmine.createSpy('gtag');
    (window as GtagWindow).gtag = gtag;
    document.addEventListener('click', stayOnPage);
    host = document.createElement('div');
    document.body.appendChild(host);
    // The visitor accepted analytics; 'sends nothing before consent' below covers the rest.
    spyOn(TestBed.inject(ConsentService), 'granted').and.returnValue(true);
    service = TestBed.inject(AnalyticsService);
  });

  afterEach(() => {
    delete (window as GtagWindow).gtag;
    document.removeEventListener('click', stayOnPage);
    host.remove();
  });

  /** Renders `html` into the page and clicks the element matching `selector` (default: the first link). */
  function click(html: string, selector = 'a'): void {
    host.innerHTML = html;
    host.querySelector<HTMLElement>(selector)!.click();
  }

  it('sends an event to gtag with its parameters', () => {
    service.track('order_click', { product_id: 'variant-1', product_name: 'Държач' });
    expect(gtag).toHaveBeenCalledOnceWith('event', 'order_click', { product_id: 'variant-1', product_name: 'Държач' });
  });

  it('sends nothing before the visitor accepted analytics', () => {
    (TestBed.inject(ConsentService).granted as jasmine.Spy).and.returnValue(false);
    service.track('quote_click', { cta_location: 'navbar' });
    service.search('pla', 3, 'blog', true);
    expect(gtag).not.toHaveBeenCalled();
  });

  it('does nothing without gtag (blocked by the visitor, unit tests)', () => {
    delete (window as GtagWindow).gtag;
    expect(() => service.track('quote_click', { cta_location: 'navbar' })).not.toThrow();
  });

  it('never lets a failing gtag break the page', () => {
    gtag.and.throwError('blocked');
    expect(() => service.track('quote_click', { cta_location: 'navbar' })).not.toThrow();
  });

  describe('link tracking', () => {
    beforeEach(() => service.trackLinks());

    it('reports phone, Viber and e-mail taps as contact_click, with the area around the link', () => {
      click('<footer data-analytics-area="footer"><a href="tel:+359883310616">call</a></footer>');
      click('<div data-analytics-area="contact_info"><a href="viber://chat?number=%2B359883310616">viber</a></div>');
      click('<a href="mailto:3dpechat.bg@gmail.com">mail</a>');

      expect(gtag.calls.allArgs()).toEqual([
        ['event', 'contact_click', { method: 'phone', cta_location: 'footer' }],
        ['event', 'contact_click', { method: 'viber', cta_location: 'contact_info' }],
        ['event', 'contact_click', { method: 'email', cta_location: 'content' }]
      ]);
    });

    it('reports a link to the contact page in any language as quote_click', () => {
      click('<nav data-analytics-area="navbar"><a href="/contact/">Оферта</a></nav>');
      click('<section data-analytics-area="home_cta"><a href="/en/contact">Get a quote</a></section>');

      expect(gtag.calls.allArgs()).toEqual([
        ['event', 'quote_click', { cta_location: 'navbar' }],
        ['event', 'quote_click', { cta_location: 'home_cta' }]
      ]);
    });

    it('takes the nearest area, and counts a click on the icon inside a link', () => {
      click('<footer data-analytics-area="footer"><div data-analytics-area="article_cta">'
        + '<a href="/contact/"><igx-icon>call</igx-icon> Контакти</a></div></footer>', 'igx-icon');

      expect(gtag).toHaveBeenCalledOnceWith('event', 'quote_click', { cta_location: 'article_cta' });
    });

    it('ignores every other link and click', () => {
      click('<a href="/prices/">Цени</a>');
      click('<a href="/contact-us/">not the contact page</a>');
      click('<a href="/blog/contact/">a post</a>');
      click('<a href="https://example.com/contact/">another site</a>');
      click('<button type="button">Поръчайте</button>', 'button');

      expect(gtag).not.toHaveBeenCalled();
    });

    it('listens only once, however often it is started', () => {
      service.trackLinks();
      click('<a href="tel:+359883310616">call</a>');
      expect(gtag).toHaveBeenCalledTimes(1);
    });

    it('stops listening when the app is destroyed', () => {
      TestBed.resetTestingModule();
      click('<a href="tel:+359883310616">call</a>');
      expect(gtag).not.toHaveBeenCalled();
    });
  });

  describe('search', () => {
    beforeEach(() => jasmine.clock().install());
    afterEach(() => jasmine.clock().uninstall());

    it('sends a typed search once the visitor stops typing, with the last term and its results', () => {
      service.search('p', 9, 'blog');
      service.search('pl', 5, 'blog');
      service.search('PLA ', 3, 'blog');
      jasmine.clock().tick(SEARCH_PAUSE_MS - 1);
      expect(gtag).not.toHaveBeenCalled();

      jasmine.clock().tick(1);
      expect(gtag).toHaveBeenCalledOnceWith('event', 'search', { search_term: 'pla', search_type: 'blog', result_count: 3 });
    });

    it('sends a tag click at once', () => {
      service.search('PETG', 2, 'blog_tag', true);
      expect(gtag).toHaveBeenCalledOnceWith('event', 'search', { search_term: 'petg', search_type: 'blog_tag', result_count: 2 });
    });

    it('skips one-letter terms, a cleared box and a repeat of the last search', () => {
      service.search('pla', 3, 'blog', true);
      service.search('x', 0, 'blog');
      service.search('', 9, 'blog');
      service.search('pla', 3, 'blog');
      jasmine.clock().tick(SEARCH_PAUSE_MS);

      expect(gtag).toHaveBeenCalledTimes(1);
    });
  });
});

describe('AnalyticsService during prerender', () => {
  it('sends nothing and adds no listener', () => {
    const gtag = jasmine.createSpy('gtag');
    (window as GtagWindow).gtag = gtag;
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const service = TestBed.inject(AnalyticsService);
    const listen = spyOn(document, 'addEventListener').and.callThrough();

    service.trackLinks();
    service.track('quote_click', { cta_location: 'navbar' });

    expect(listen).not.toHaveBeenCalled();
    expect(gtag).not.toHaveBeenCalled();
    delete (window as GtagWindow).gtag;
  });
});
