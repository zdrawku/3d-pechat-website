import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideMarkdown } from 'ngx-markdown';

import { FAQ, ThreeDPechatPoPorachkaSofiaVideoComponent } from './3d-pechat-po-porachka-sofia-video.component';

describe('ThreeDPechatPoPorachkaSofiaVideoComponent', () => {
  let fixture: ComponentFixture<ThreeDPechatPoPorachkaSofiaVideoComponent>;
  let el: HTMLElement;
  const markdown = () =>
    fixture.componentInstance.postContent + fixture.componentInstance.postContentAfterVideo;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreeDPechatPoPorachkaSofiaVideoComponent],
      providers: [provideRouter([]), provideMarkdown()],
    }).compileComponents();
    fixture = TestBed.createComponent(ThreeDPechatPoPorachkaSofiaVideoComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('splits the article around the video marker', () => {
    const c = fixture.componentInstance;
    expect(c.postContent).toContain('# Вижте как работим');
    expect(c.postContentAfterVideo).toContain('## Какво ще видите във видеото');
    expect(markdown()).not.toContain('<!-- video -->');
  });

  it('places the promo video player between the two halves', () => {
    const player = el.querySelector('[data-testid="article-video"]');
    expect(player).withContext('app-youtube-embed').not.toBeNull();
    const halves = el.querySelectorAll('markdown');
    expect(halves.length).toBe(2);
    expect(halves[0].nextElementSibling).toBe(player);
    expect(player!.querySelector('iframe')).withContext('no YouTube request before play').toBeNull();
  });

  it('links the products shown in the video to their catalog cards', () => {
    expect(markdown()).toContain('/products/#razdeliteli-za-knigi');
    expect(markdown()).toContain('/products/#variant-2');
    expect(markdown()).toContain('/contact/');
  });

  it('keeps the visible FAQ and the FAQPage JSON-LD in sync', () => {
    for (const { question, answer } of FAQ) {
      expect(markdown()).toContain(`### ${question}`);
      expect(markdown()).toContain(answer);
    }
    const data = JSON.parse(document.getElementById('structured-data-jsonld')?.textContent ?? '{}');
    const types = (data['@graph'] as { '@type': string }[]).map((n) => n['@type']);
    expect(types).toEqual(['BlogPosting', 'VideoObject', 'FAQPage']);
    const faq = data['@graph'][2];
    expect(faq.mainEntity.map((q: { name: string }) => q.name)).toEqual(FAQ.map((f) => f.question));
  });

  it('builds the chrome from Ignite UI components', () => {
    expect(el.querySelector('button[igxButton]')).withContext('back button').toBeTruthy();
    expect(el.querySelector('app-youtube-embed igx-card')).withContext('player card').toBeTruthy();
    const cta = el.querySelector('[data-testid="article-cta"]')!;
    expect(cta.querySelectorAll('a[igxButton]').length).toBe(3);
    expect(cta.querySelector('a[igxButton="contained"]')?.getAttribute('href')).toBe('/products');
  });

  it('offers the YouTube subscribe CTA in a new tab', () => {
    const link = el.querySelector<HTMLAnchorElement>('[data-testid="article-cta-subscribe"]')!;
    expect(link.getAttribute('href')).toBe('https://www.youtube.com/@3dpechatbg?sub_confirmation=1');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.querySelector('igx-icon[name="youtube"]')).not.toBeNull();
  });
});
