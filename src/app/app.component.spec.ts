import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { IGX_NAVBAR_DIRECTIVES, IgxIconComponent, IgxButtonDirective, IgxIconButtonDirective, IGX_NAVIGATION_DRAWER_DIRECTIVES } from 'igniteui-angular';
import { AppComponent } from './app.component';

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
