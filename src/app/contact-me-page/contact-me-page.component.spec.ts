import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { IGX_INPUT_GROUP_DIRECTIVES, IgxButtonDirective } from 'igniteui-angular';
import { ContactMePageComponent } from './contact-me-page.component';

describe('ContactMePageComponent', () => {
  let component: ContactMePageComponent;
  let fixture: ComponentFixture<ContactMePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactMePageComponent, NoopAnimationsModule, FormsModule, ReactiveFormsModule, IGX_INPUT_GROUP_DIRECTIVES, IgxButtonDirective]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactMePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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
