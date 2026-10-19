import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { IgxDropDownComponent } from 'igniteui-angular';

import { LanguageSwitcherComponent } from './language-switcher.component';
import { I18nService } from '../../i18n/i18n.service';
import { LOCALES } from '../../i18n/locales';

describe('LanguageSwitcherComponent', () => {
  let fixture: ComponentFixture<LanguageSwitcherComponent>;
  let host: HTMLElement;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSwitcherComponent],
      providers: [provideRouter([]), provideNoopAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSwitcherComponent);
    host = fixture.nativeElement;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  const trigger = () => host.querySelector<HTMLButtonElement>('[data-testid="language-switcher"]')!;
  const dropDown = () => fixture.debugElement.query((el) => el.componentInstance instanceof IgxDropDownComponent)
    .componentInstance as IgxDropDownComponent;

  // Approved design „A“ (FEATURE-IDEAS-PLAN.md): an igxButton pill opening an
  // igx-drop-down. Locks it to Ignite UI so it can't regress to plain HTML.
  it('builds the switcher from Ignite UI components', () => {
    expect(trigger().hasAttribute('igxButton')).withContext('trigger is an igxButton').toBeTrue();
    expect(trigger().querySelectorAll('igx-icon').length).withContext('globe + caret igx-icons').toBe(2);
    expect(host.querySelector('igx-drop-down')).withContext('menu is an igx-drop-down').not.toBeNull();
  });

  it('shows the current language and names it for screen readers', () => {
    expect(trigger().querySelector('.lang-trigger__code')?.textContent?.trim()).toBe('bg');
    expect(trigger().getAttribute('aria-label')).toBe('Език: Български. Смени езика');
    expect(trigger().getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('lists every language by its own name, the current one selected', () => {
    dropDown().open();
    fixture.detectChanges();

    const options = Array.from(document.querySelectorAll<HTMLElement>('igx-drop-down-item[data-testid^="language-option-"]'));
    expect(options.map((o) => o.getAttribute('lang'))).toEqual(LOCALES.map((l) => l.code));
    expect(options.map((o) => o.textContent)).toEqual(LOCALES.map((l) => jasmine.stringContaining(l.label)));
    expect(dropDown().selectedItem?.value).toBe('bg');
    expect(trigger().getAttribute('aria-expanded')).toBe('true');

    dropDown().close();
    fixture.detectChanges();
  });

  it('opens the same page in the chosen language', () => {
    spyOnProperty(router, 'url').and.returnValue('/prices/');
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    dropDown().open();
    fixture.detectChanges();
    const english = dropDown().items.find((item) => item.value === 'en')!;
    dropDown().selectItem(english);

    // TrailingSlashUrlSerializer parses the trailing slash away, so this lands on the page.
    expect(navigate).toHaveBeenCalledOnceWith('/en/prices/');
    dropDown().close();
  });

  it('does nothing when the current language is chosen again', () => {
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    dropDown().open();
    fixture.detectChanges();
    const bulgarian = dropDown().items.find((item) => item.value === 'bg')!;
    dropDown().selectItem(bulgarian);

    expect(navigate).not.toHaveBeenCalled();
    dropDown().close();
  });

  it('switches its labels with the language', async () => {
    await TestBed.inject(I18nService).use('en');
    fixture.detectChanges();
    expect(trigger().querySelector('.lang-trigger__code')?.textContent?.trim()).toBe('en');
    expect(trigger().getAttribute('aria-label')).toBe('Language: English. Change language');
  });
});
