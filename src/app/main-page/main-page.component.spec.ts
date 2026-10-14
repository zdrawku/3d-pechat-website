import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { IgxButtonDirective, IGX_CAROUSEL_DIRECTIVES } from 'igniteui-angular';
import { MainPageComponent } from './main-page.component';

describe('MainPageComponent', () => {
  let component: MainPageComponent;
  let fixture: ComponentFixture<MainPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainPageComponent, NoopAnimationsModule, FormsModule, ReactiveFormsModule, IgxButtonDirective, IGX_CAROUSEL_DIRECTIVES]
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
      expect(el.querySelector('button[igxButton="contained"]')).withContext('offer CTA').not.toBeNull();
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
});
