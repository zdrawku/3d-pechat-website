import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { IGX_NAVBAR_DIRECTIVES, IgxIconComponent, IgxButtonDirective, IgxIconButtonDirective, IGX_NAVIGATION_DRAWER_DIRECTIVES } from 'igniteui-angular';
import { AppComponent } from './app.component';
import { BUSINESS } from '../data/business';
import { I18nService } from './i18n/i18n.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, NoopAnimationsModule, FormsModule, ReactiveFormsModule, RouterTestingModule, IGX_NAVBAR_DIRECTIVES, IgxIconComponent, IgxButtonDirective, IgxIconButtonDirective, IGX_NAVIGATION_DRAWER_DIRECTIVES]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('makes the footer phone and Viber entries clickable links', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('footer a[href="tel:+359883310616"]'))
      .withContext('footer tel: link').not.toBeNull();
    expect(host.querySelector('footer a[href="viber://chat?number=%2B359883310616"]'))
      .withContext('footer Viber link').not.toBeNull();
  });

  it('shows the footer address from business.json (matches the schema and map listing)', () => {
    const address = (fixture.nativeElement as HTMLElement).querySelector('footer [data-testid="footer-address"]');
    expect(address?.textContent?.trim()).toBe(BUSINESS.displayAddress);
  });

  it('links the YouTube channel from the navbar and footer as Ignite icon links', () => {
    const host: HTMLElement = fixture.nativeElement;
    const links = Array.from(
      host.querySelectorAll<HTMLAnchorElement>('a[href="https://www.youtube.com/@3dpechatbg"]')
    );
    expect(links.length).withContext('navbar + footer YouTube links').toBeGreaterThanOrEqual(2);
    for (const link of links) {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.getAttribute('aria-label')).withContext('accessible name').toBeTruthy();
      expect(link.querySelector('igx-icon[name="youtube"]'))
        .withContext('uses the imx-icons YouTube igx-icon, not an inline SVG').not.toBeNull();
    }
    const navLink = host.querySelector('[data-testid="youtube-nav-link"]');
    expect(navLink?.hasAttribute('igxIconButton')).withContext('navbar link styled via igxIconButton').toBeTrue();
    expect(host.querySelector('footer [data-testid="youtube-footer-link"]')).withContext('footer link').not.toBeNull();
  });

  describe('languages', () => {
    afterEach(() => document.documentElement.setAttribute('lang', 'bg'));

    it('puts the language switcher in the navbar, next to the theme switch', () => {
      const navbar = (fixture.nativeElement as HTMLElement).querySelector('igx-navbar')!;
      const switcher = navbar.querySelector('app-language-switcher');
      expect(switcher).withContext('switcher in the navbar').not.toBeNull();
      expect(switcher?.nextElementSibling?.getAttribute('data-testid')).toBe('theme-toggle');
    });

    it('links this page in every other language from the footer, crawlably', () => {
      const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('footer [data-testid="footer-language-en"]');
      expect(link?.textContent?.trim()).toBe('English');
      expect(link?.getAttribute('hreflang')).toBe('en');
      expect(link?.getAttribute('lang')).toBe('en');
      expect(link?.getAttribute('href')).toMatch(/^\/en\/?$/);
    });

    it('renders the shell in English on English pages', async () => {
      await TestBed.inject(I18nService).use('en');
      fixture.detectChanges();
      const host: HTMLElement = fixture.nativeElement;

      expect(host.querySelector('.menu-trigger-label')?.textContent?.trim()).toBe('Menu');
      expect(host.querySelector('.nav_cta_button')?.textContent?.trim()).toBe('Get a quote');
      expect(host.querySelector('footer [data-testid="footer-address"]')?.textContent?.trim()).toBe(BUSINESS.displayAddressEn);
      expect(host.querySelector('footer [data-testid="footer-language-bg"]')?.textContent?.trim()).toBe('Български');
      expect(host.querySelector('footer [data-testid="footer-language-en"]')).withContext('no link to the current language').toBeNull();
    });
  });

  describe('outside-click drawer close', () => {
    /** Forces the desktop/mobile branch of the handler's matchMedia check. */
    function setViewport(isDesktop: boolean): void {
      spyOn(window, 'matchMedia').and.returnValue({
        matches: isDesktop,
        media: '(min-width: 1024px)'
      } as MediaQueryList);
    }

    function clickOutside(): void {
      const outside = document.createElement('div');
      document.body.appendChild(outside);
      component.onDocumentClick({ target: outside } as unknown as MouseEvent);
      outside.remove();
    }

    beforeEach(() => {
      // The handler no-ops unless the drawer reports itself open.
      component.drawer = { isOpen: true, pin: false, close: jasmine.createSpy('close') } as never;
    });

    // Desktop: the drawer is a sticky sidebar BESIDE the content and starts
    // open, so ordinary page clicks must not collapse it — the hamburger is the
    // only control. This guards the regression where every interaction closed it.
    it('does NOT close on desktop (>=1024px)', () => {
      setViewport(true);
      clickOutside();
      expect(component.drawer.close).not.toHaveBeenCalled();
    });

    // `[isOpen]` is bound to this field. If it is left true while the drawer is
    // closed, the next change-detection pass re-applies true and reopens the
    // drawer — the bug that made outside-click dismissal impossible.
    it('clears drawerOpen when closing, so the binding cannot reopen it', () => {
      setViewport(false);
      component.drawerOpen = true;
      clickOutside();
      expect(component.drawerOpen).toBeFalse();
    });

    // Mobile: the drawer is an overlay ON TOP of the content, so a click on the
    // page behind it means "dismiss".
    it('closes on mobile (<1024px)', () => {
      setViewport(false);
      clickOutside();
      expect(component.drawer.close).toHaveBeenCalled();
    });

    // These two use the elements the component actually renders — the handler
    // resolves them via its own host, so a synthetic stand-alone node would not
    // be the one it finds.
    it('does not close when the click lands inside the drawer', () => {
      setViewport(false);
      const aside: HTMLElement | null =
        fixture.nativeElement.querySelector('.igx-nav-drawer__aside');
      expect(aside).withContext('drawer aside should be rendered').toBeTruthy();

      component.onDocumentClick({ target: aside } as unknown as MouseEvent);
      expect(component.drawer.close).not.toHaveBeenCalled();
    });

    it('ignores clicks on the hamburger, which toggles itself', () => {
      setViewport(false);
      const trigger: HTMLElement | null =
        fixture.nativeElement.querySelector('.menu-trigger');
      expect(trigger).withContext('hamburger should be rendered').toBeTruthy();

      component.onDocumentClick({ target: trigger } as unknown as MouseEvent);
      expect(component.drawer.close).not.toHaveBeenCalled();
    });
  });
});
