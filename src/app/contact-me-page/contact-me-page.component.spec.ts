import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { IGX_INPUT_GROUP_DIRECTIVES, IgxButtonDirective } from 'igniteui-angular';
import { ContactMePageComponent } from './contact-me-page.component';

describe('ContactMePageComponent', () => {
  let component: ContactMePageComponent;
  let fixture: ComponentFixture<ContactMePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactMePageComponent, NoopAnimationsModule, FormsModule, ReactiveFormsModule, IGX_INPUT_GROUP_DIRECTIVES, IgxButtonDirective],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactMePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('headings and intro (SEO)', () => {
    it('has exactly one H1', () => {
      const h1s = (fixture.nativeElement as HTMLElement).querySelectorAll('h1');
      expect(h1s.length).toBe(1);
      expect(h1s[0].textContent).toContain('Контакти');
    });

    it('has an intro of 80-150 words covering delivery, response time and address', () => {
      const intro = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="contact-intro"]')!;
      const text = intro.textContent!.trim();
      const words = text.split(/\s+/).length;
      expect(words).withContext('intro word count').toBeGreaterThanOrEqual(80);
      expect(words).withContext('intro word count').toBeLessThanOrEqual(150);
      expect(text).toContain('София');
      expect(text).toContain('куриер');
      expect(text).toContain('24 часа');
      expect(text).toContain('кв. Витоша, бул. „Симеоновско шосе“ 110 б, ет. 2');
      expect(text).toContain('9:00 до 18:00');
    });

    it('tells visitors to send model files by email or Viber (the form takes no attachments)', () => {
      const note = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="contact-file-note"]')!;
      expect(note).withContext('file note').not.toBeNull();
      expect(note.querySelector('igx-icon')).withContext('Ignite icon').not.toBeNull();
      expect(note.textContent).toContain('STL');
      expect(note.textContent).toContain('Viber');
      expect(note.querySelector('a')?.getAttribute('href')).toBe('mailto:3dpechat.bg@gmail.com');
    });
  });

  describe('contact links', () => {
    const host = (): HTMLElement => fixture.nativeElement;

    it('makes the phone number a tel: link', () => {
      const tel = host().querySelector<HTMLAnchorElement>('.info-text a[href="tel:+359883310616"]');
      expect(tel).withContext('phone tel: link').not.toBeNull();
    });

    it('opens a Viber chat with an encoded + (not viber://add, not unsafe:)', () => {
      const viber = host().querySelector<HTMLAnchorElement>('a.viber-pill');
      expect(viber).withContext('Viber link').not.toBeNull();
      expect(viber!.getAttribute('href')).toBe('viber://chat?number=%2B359883310616');
      expect(viber!.hasAttribute('igxButton')).withContext('styled via igxButton').toBeTrue();
    });

    it('offers a YouTube social pill built from Ignite components that opens the channel', () => {
      const pill = host().querySelector<HTMLButtonElement>('[data-testid="youtube-contact-button"]');
      expect(pill).withContext('YouTube pill').not.toBeNull();
      expect(pill!.hasAttribute('igxButton')).withContext('styled via igxButton').toBeTrue();
      expect(pill!.querySelector('igx-icon[name="youtube"]')).withContext('YouTube igx-icon').not.toBeNull();

      const open = spyOn(window, 'open');
      pill!.click();
      expect(open).toHaveBeenCalledWith('https://www.youtube.com/@3dpechatbg', '_blank');
    });
  });
});
