import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, UrlSerializer } from '@angular/router';

import { IgxButtonDirective, IGX_CAROUSEL_DIRECTIVES } from 'igniteui-angular';
import { MainPageComponent } from './main-page.component';
import { TrailingSlashUrlSerializer } from '../trailing-slash-url-serializer';

describe('MainPageComponent', () => {
  let component: MainPageComponent;
  let fixture: ComponentFixture<MainPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainPageComponent, NoopAnimationsModule, FormsModule, ReactiveFormsModule, IgxButtonDirective, IGX_CAROUSEL_DIRECTIVES],
      providers: [provideRouter([]), { provide: UrlSerializer, useClass: TrailingSlashUrlSerializer }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('„Вижте ни в действие“ video section', () => {
    const section = (): HTMLElement =>
      fixture.nativeElement.querySelector('[data-testid="home-video-section"]');

    it('sits between „Как работим“ and „За технологията“ without replacing either', () => {
      const el = section();
      expect(el).withContext('video section').not.toBeNull();
      expect(el.previousElementSibling?.classList.contains('process_section'))
        .withContext('right after the process steps').toBeTrue();
      expect(el.nextElementSibling?.classList.contains('image_gallery_section_template_1'))
        .withContext('right before the about + gallery block').toBeTrue();
      // The hero picture and the gallery carousel are untouched.
      expect(fixture.nativeElement.querySelector('.hero_image_main')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('igx-carousel')).not.toBeNull();
    });

    it('builds the section from Ignite UI components', () => {
      const el = section();
      expect(el.querySelector('app-youtube-embed igx-card')).withContext('player card').not.toBeNull();
      expect(el.querySelector('a[igxButton="contained"][href="/contact/"]')).withContext('offer CTA link').not.toBeNull();
      expect(el.querySelector('a[igxButton="outlined"] igx-icon[name="youtube"]'))
        .withContext('subscribe button with YouTube igx-icon').not.toBeNull();
    });

    it('links „Абонирай се“ to the subscribe confirmation in a new tab', () => {
      const link = section().querySelector<HTMLAnchorElement>('[data-testid="home-video-subscribe"]')!;
      expect(link.textContent).toContain('Абонирай се');
      expect(link.getAttribute('href')).toBe('https://www.youtube.com/@3dpechatbg?sub_confirmation=1');
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
    });

    it('describes the video with VideoObject structured data', () => {
      const script = document.getElementById('structured-data-jsonld');
      const data = JSON.parse(script?.textContent ?? '{}');
      expect(data['@type']).toBe('VideoObject');
      expect(data.contentUrl).toBe('https://www.youtube.com/watch?v=f8yTuEcOCjU');
    });
  });

  // The hero, video and final-CTA actions must be real links: Googlebot only follows
  // <a href>, and a (click) handler on a <button> left the homepage with no
  // crawlable path to /contact or /portfolio.
  it('exposes crawlable Ignite UI links to contact and portfolio', () => {
    const el: HTMLElement = fixture.nativeElement;
    const hrefs = (selector: string) =>
      Array.from(el.querySelectorAll<HTMLAnchorElement>(selector)).map(a => a.getAttribute('href'));

    expect(hrefs('a[igxButton][href]')).toEqual(
      jasmine.arrayContaining(['/contact/', '/portfolio/'])
    );
    expect(el.querySelector('.hero_cta_row a.btn_primary')?.getAttribute('href')).toBe('/contact/');
    expect(el.querySelector('.hero_cta_row a.btn_ghost')?.getAttribute('href')).toBe('/portfolio/');
    expect(el.querySelector('.cta-band a.cta-band__btn[href="/contact/"]')).not.toBeNull();
    // (the carousel renders its own prev/next igxButton <button>s, so scope to the CTAs)
    expect(el.querySelectorAll('.hero_cta_row button, .cta-band button').length).toBe(0);
  });
});
