import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideMarkdown } from 'ngx-markdown';

import productsData from '../../../data/products.json';
import { MAKERWORLD_COIN_CARD_URL } from '../../../data/site-links';
import { routes } from '../../app.routes';
import { I18nService } from '../../i18n/i18n.service';
import { TRANSLATED_POSTS } from '../../i18n/locales';
import { PageNotFoundComponent } from '../../error-routing/not-found/not-found.component';
import { BLOG_POSTS } from '../../services/blog-posts.registry';
import { faqFromMarkdown } from '../shared/article-markdown';
import { BlogArticleComponent } from './article.component';

/** What the template renders from (protected in the component). */
interface Rendered {
  postContent: string;
  postContentAfterVideo: string;
}

describe('BlogArticleComponent', () => {
  let harness: RouterTestingHarness;
  const english = TRANSLATED_POSTS.en ?? {};

  beforeEach(async () => {
    TestBed.configureTestingModule({
      // The real routes: the locale guard, the post matcher and the text resolver run as on the site.
      providers: [provideRouter(routes), provideMarkdown(), provideNoopAnimations()]
    });
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => {
    document.documentElement.setAttribute('lang', 'bg');
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((l) => l.remove());
  });

  /** Opens a post by URL (no trailing slash: the app's TrailingSlashUrlSerializer isn't provided here). */
  async function open(url: string) {
    const component = await harness.navigateByUrl(url, BlogArticleComponent);
    harness.detectChanges();
    const rendered = (component as unknown as { view: () => Rendered }).view();
    return { el: harness.routeNativeElement as HTMLElement, text: rendered.postContent + rendered.postContentAfterVideo, rendered, component };
  }
  const openBulgarian = (slug: string) => open(`/blog/${slug}`);
  const openEnglish = (source: string) => open(`/en/blog/${english[source]}`);

  const graph = (): { '@type': string; [key: string]: unknown }[] =>
    JSON.parse(document.getElementById('structured-data-jsonld')?.textContent ?? '{}')['@graph'];
  const canonical = () => document.querySelector('link[rel="canonical"]')?.getAttribute('href');

  describe('every post', () => {
    it('renders every Bulgarian post at its own canonical URL', async () => {
      for (const post of BLOG_POSTS) {
        const { text } = await openBulgarian(post.slug);
        expect(document.documentElement.lang).withContext(post.slug).toBe('bg');
        expect(text).withContext(post.slug).toMatch(/^# \S/);
        expect(canonical()).withContext(post.slug).toBe(`https://3dpechat.bg/blog/${post.slug}/`);
        expect(graph()[0]['headline']).withContext(post.slug).toBe(post.title);
      }
    });

    it('renders every English post in English, at its own canonical URL', async () => {
      for (const [source, slug] of Object.entries(english)) {
        const { text } = await openEnglish(source);
        expect(document.documentElement.lang).withContext(slug).toBe('en');
        expect(text).withContext(slug).toMatch(/^# \S/);
        expect(text).withContext(slug).not.toContain('<!-- video -->');
        expect(canonical()).withContext(slug).toBe(`https://3dpechat.bg/en/blog/${slug}/`);
        expect(graph()[0]['inLanguage']).withContext(slug).toBe('en');
      }
    });

    it('follows the route from one post to the next (the router reuses the component)', async () => {
      const first = await openBulgarian('what-is-3d-printing');
      const second = await openBulgarian('3d-printing-technologies');
      expect(second.component).withContext('same instance').toBe(first.component);
      expect(second.text).toContain(BLOG_POSTS.find((p) => p.slug === '3d-printing-technologies')!.title.slice(0, 20));
      expect(canonical()).toBe('https://3dpechat.bg/blog/3d-printing-technologies/');
      const related = Array.from(second.el.querySelectorAll('[data-testid="related-posts"] a')).map((a) => a.getAttribute('href'));
      expect(related).not.toContain('/blog/3d-printing-technologies');
      expect(second.el.querySelector('[data-testid="article-back"]')).not.toBeNull();
    });

    it('sends an unknown slug to the 404 page, in each language', async () => {
      await harness.navigateByUrl('/blog/no-such-post', PageNotFoundComponent);
      await harness.navigateByUrl('/en/blog/no-such-post', PageNotFoundComponent);
      // A Bulgarian slug is not an English post.
      await harness.navigateByUrl('/en/blog/what-is-3d-printing', PageNotFoundComponent);
    });

    it('builds the page from Ignite UI components', async () => {
      const { el } = await openEnglish('pla-pla-pla-pro-i-pln-razliki-i-izbor');
      const back = el.querySelector<HTMLAnchorElement>('app-article-toolbar a[igxButton="outlined"].back-button');
      expect(back?.getAttribute('href')).toBe('/en/blog');
      expect(back?.textContent).toContain('Back to articles');
      expect(back?.querySelector('igx-icon')).withContext('back icon').not.toBeNull();
      const language = el.querySelector<HTMLAnchorElement>('[data-testid="article-language-link"]');
      expect(language?.matches('a[igxButton="flat"]')).toBeTrue();
      expect(language?.getAttribute('hreflang')).toBe('bg');
      expect(language?.getAttribute('href')).toBe('/blog/pla-pla-pla-pro-i-pln-razliki-i-izbor');
      expect(language?.textContent).toContain('Read in Bulgarian');
      expect(el.querySelector('app-related-content igx-card')).withContext('related cards').not.toBeNull();
    });

    it('lists only English posts under „Keep reading“ on an English post', async () => {
      const { el } = await openEnglish('pla-pla-pla-pro-i-pln-razliki-i-izbor');
      const links = Array.from(el.querySelectorAll('[data-testid="related-posts"] a')).map((a) => a.getAttribute('href'));
      expect(links.length).toBe(3);
      for (const href of links) {
        expect(href).toMatch(/^\/en\/blog\/[a-z0-9-]+$/);
      }
      expect(el.querySelector('.rc_all')?.getAttribute('href')).toBe('/en/blog');
    });

    it('turns a marked FAQ into FAQPage schema word for word, in both languages', async () => {
      for (const url of ['/blog/3d-printing-in-sofia-for-your-project', '/blog/barzi-i-umni-3d-printeri', `/en/blog/${english['3d-printing-in-sofia-for-your-project']}`]) {
        const { text } = await open(url);
        const faq = faqFromMarkdown(text);
        expect(faq.length).withContext(url).toBeGreaterThan(0);
        const schema = graph().find((n) => n['@type'] === 'FAQPage') as unknown as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
        expect(schema?.mainEntity.map((q) => q.name)).withContext(url).toEqual(faq.map((q) => q.question));
        expect(schema?.mainEntity.map((q) => q.acceptedAnswer.text)).withContext(url).toEqual(faq.map((q) => q.answer));
      }
    });

    it('adds no FAQPage schema to a post without a marked FAQ', async () => {
      await openBulgarian('what-is-3d-printing');
      expect(graph().map((n) => n['@type'])).toEqual(['BlogPosting', 'BreadcrumbList']);
    });
  });

  describe('the video post (ARTICLE_EXTRAS: featured video + CTA)', () => {
    for (const [language, url] of [['bg', '/blog/3d-pechat-po-porachka-sofia-video'], ['en', `/en/blog/${english['3d-pechat-po-porachka-sofia-video']}`]]) {
      it(`places the player between the two halves and lists VideoObject + FAQPage (${language})`, async () => {
        const { el, rendered } = await open(url);
        expect(rendered.postContentAfterVideo.length).toBeGreaterThan(0);
        const player = el.querySelector('[data-testid="article-video"]');
        expect(player).withContext('app-youtube-embed').not.toBeNull();
        const halves = el.querySelectorAll('markdown');
        expect(halves.length).toBe(2);
        expect(halves[0].nextElementSibling).toBe(player);
        expect(player!.querySelector('iframe')).withContext('no YouTube request before play').toBeNull();
        expect(graph().map((n) => n['@type'])).toEqual(['BlogPosting', 'BreadcrumbList', 'VideoObject', 'FAQPage']);
      });
    }

    it('links the catalogue cards and contact, and offers the YouTube subscribe CTA in a new tab', async () => {
      const { el, text } = await openBulgarian('3d-pechat-po-porachka-sofia-video');
      expect(text).toContain('/products/#razdeliteli-za-knigi');
      expect(text).toContain('/products/#variant-2');
      expect(text).toContain('/contact/');
      const cta = el.querySelector('[data-testid="article-cta"]')!;
      expect(cta.getAttribute('aria-label')).toBe('Следващи стъпки');
      expect(cta.querySelectorAll('a[igxButton]').length).toBe(3);
      expect(cta.querySelector('a[igxButton="contained"]')?.getAttribute('href')).toBe('/products');
      const subscribe = el.querySelector<HTMLAnchorElement>('[data-testid="article-cta-subscribe"]')!;
      expect(subscribe.getAttribute('href')).toBe('https://www.youtube.com/@3dpechatbg?sub_confirmation=1');
      expect(subscribe.getAttribute('target')).toBe('_blank');
      expect(subscribe.getAttribute('rel')).toContain('noopener');
      expect(subscribe.querySelector('igx-icon[name="youtube"]')).not.toBeNull();
    });

    it('links the English catalogue from the English version', async () => {
      const { el } = await openEnglish('3d-pechat-po-porachka-sofia-video');
      expect(el.querySelector('[data-testid="article-cta"] a[igxButton="contained"]')?.getAttribute('href')).toBe('/en/products');
    });
  });

  describe('the StandStrap post (ARTICLE_EXTRAS: clip)', () => {
    it('splits around the marker and embeds the self-hosted clip lazily, with its caption', async () => {
      const { el, rendered } = await openBulgarian('standstrap-3d-printiran-stoper-za-snoubord');
      expect(rendered.postContent).toContain('## На пистата');
      expect(rendered.postContentAfterVideo).toContain('## Искате един StandStrap?');
      const video = el.querySelector<HTMLVideoElement>('video[data-testid="article-clip"]')!;
      expect(video.getAttribute('preload')).toBe('none');
      expect(video.querySelector('source')!.getAttribute('src')).toBe('assets/blogs/videos/standstrap-na-pistata.mp4');
      const post = BLOG_POSTS.find((p) => p.slug === 'standstrap-3d-printiran-stoper-za-snoubord')!;
      expect(el.querySelector('.blog-clip figcaption')?.textContent?.trim()).toBe(post.videoCaption as string);
    });

    it('credits Gripsta and links the product card and MakerWorld', async () => {
      const { text } = await openBulgarian('standstrap-3d-printiran-stoper-za-snoubord');
      expect(text).toContain('https://gripsta.com/');
      expect(text).toContain('/products/#standstrap-stoper-za-snoubord');
      expect(text).toContain('https://makerworld.com/en/models/3427894-standstrap');
    });

    it('shows the English caption on the English version', async () => {
      const { el } = await openEnglish('standstrap-3d-printiran-stoper-za-snoubord');
      const copy = TestBed.inject(I18nService).content().blog['standstrap-3d-printiran-stoper-za-snoubord'];
      expect(el.querySelector('.blog-clip figcaption')?.textContent?.trim()).toBe(copy.videoCaption as string);
    });
  });

  describe('the coin card post (ARTICLE_EXTRAS: CTA + MakerWorld)', () => {
    for (const [language, url] of [['bg', '/blog/monetna-karta-bulgarski-evro-moneti'], ['en', `/en/blog/${english['monetna-karta-bulgarski-evro-moneti']}`]]) {
      it(`fills the MakerWorld link and never ships the placeholder (${language})`, async () => {
        const { el, text } = await open(url);
        expect(text).toContain(MAKERWORLD_COIN_CARD_URL);
        expect(text).not.toContain('{{MAKERWORLD_URL}}');
        expect(text).not.toContain('<!-- makerworld -->');
        expect(el.querySelectorAll('[data-testid="article-cta"] a[igxButton]').length).toBe(2);
        expect(graph().map((n) => n['@type'])).toContain('FAQPage');
      });
    }

    it('links every one of the five coin card products, and every image has alt text', async () => {
      const { text } = await openBulgarian('monetna-karta-bulgarski-evro-moneti');
      for (let n = 1; n <= 5; n++) {
        expect(text).toContain(`/products/#variant-${n}`);
        expect((productsData as { linkId: string }[]).some((p) => p.linkId === `variant-${n}`)).toBeTrue();
      }
      const images = text.match(/!\[[^\]]*\]\([^)]+\)/g) ?? [];
      expect(images.length).toBeGreaterThanOrEqual(6);
      images.forEach((img) => expect(img).not.toMatch(/^!\[\s*\]/));
    });
  });
});
