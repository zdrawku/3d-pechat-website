import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { IgxDropDownComponent } from 'igniteui-angular';

import { LanguageSwitcherComponent } from './language-switcher.component';
import { I18nService } from '../../i18n/i18n.service';
import { LOCALES } from '../../i18n/locales';
import { AnalyticsService } from '../../services/analytics.service';

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

  afterEach(() => {
    const dd = dropDownOrNull();
    if (dd && !dd.collapsed) {
      dd.close();
    }
  });

  const trigger = () => host.querySelector<HTMLButtonElement>('[data-testid="language-switcher"]')!;
  const dropDownOrNull = () =>
    fixture.debugElement.query((el) => el.componentInstance instanceof IgxDropDownComponent)?.componentInstance as IgxDropDownComponent | undefined;
  const dropDown = () => dropDownOrNull()!;

  /** The first click loads the deferred menu, which opens straight away. */
  async function openMenu(): Promise<void> {
    trigger().click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  const key = (name: string) => trigger().dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));

  // Approved design „A“ (FEATURE-IDEAS-PLAN.md): an igxButton pill opening an
  // igx-drop-down. Locks it to Ignite UI so it can't regress to plain HTML.
  it('builds the switcher from Ignite UI components', async () => {
    expect(trigger().hasAttribute('igxButton')).withContext('trigger is an igxButton').toBeTrue();
    expect(trigger().querySelectorAll('igx-icon').length).withContext('globe + caret igx-icons').toBe(2);
    await openMenu();
    expect(host.querySelector('igx-drop-down')).withContext('menu is an igx-drop-down').not.toBeNull();
  });

  it('loads the menu only when it is first used (it is deferred)', () => {
    expect(host.querySelector('app-language-menu')).toBeNull();
    expect(host.querySelector('igx-drop-down')).toBeNull();
  });

  it('shows the current language and names it for screen readers', () => {
    expect(trigger().querySelector('.lang-trigger__code')?.textContent?.trim()).toBe('bg');
    expect(trigger().getAttribute('aria-label')).toBe('Език: Български. Смени езика');
    expect(trigger().getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('opens on the first click and lists every language by its own name, the current one selected', async () => {
    await openMenu();

    expect(dropDown().collapsed).toBeFalse();
    const options = Array.from(document.querySelectorAll<HTMLElement>('igx-drop-down-item[data-testid^="language-option-"]'));
    expect(options.map((o) => o.getAttribute('lang'))).toEqual(LOCALES.map((l) => l.code));
    expect(options.map((o) => o.textContent)).toEqual(LOCALES.map((l) => jasmine.stringContaining(l.label)));
    expect(dropDown().selectedItem?.value).toBe('bg');
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(trigger().classList).toContain('lang-trigger--open');
  });

  it('closes and reopens from the pill', async () => {
    await openMenu();
    trigger().click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(dropDown().collapsed).toBeTrue();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');

    trigger().click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(dropDown().collapsed).toBeFalse();
  });

  it('opens the same page in the chosen language', async () => {
    spyOnProperty(router, 'url').and.returnValue('/prices/');
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    await openMenu();
    const english = dropDown().items.find((item) => item.value === 'en')!;
    dropDown().selectItem(english);

    // TrailingSlashUrlSerializer parses the trailing slash away, so this lands on the page.
    expect(navigate).toHaveBeenCalledOnceWith('/en/prices/');
  });

  it('does nothing when the current language is chosen again', async () => {
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const track = spyOn(TestBed.inject(AnalyticsService), 'track');

    await openMenu();
    const bulgarian = dropDown().items.find((item) => item.value === 'bg')!;
    dropDown().selectItem(bulgarian);

    expect(navigate).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });

  it('reports the switch to GA as select_language', async () => {
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const track = spyOn(TestBed.inject(AnalyticsService), 'track');

    await openMenu();
    dropDown().selectItem(dropDown().items.find((item) => item.value === 'en')!);

    expect(track).toHaveBeenCalledOnceWith('select_language', { selected_language: 'en', previous_language: 'bg', cta_location: 'navbar' });
  });

  it('works from the keyboard on the pill: arrows move, Enter chooses, Escape closes', async () => {
    spyOnProperty(router, 'url').and.returnValue('/contact/');
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    await openMenu();
    key('Escape');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(dropDown().collapsed).withContext('Escape closes').toBeTrue();

    trigger().click();
    fixture.detectChanges();
    await fixture.whenStable();
    // Bulgarian (current) → English is the next option.
    key('ArrowDown');
    key('ArrowDown');
    fixture.detectChanges();
    key('Enter');
    expect(navigate).toHaveBeenCalledOnceWith('/en/contact/');
  });

  it('switches its labels with the language', async () => {
    await TestBed.inject(I18nService).use('en');
    fixture.detectChanges();
    expect(trigger().querySelector('.lang-trigger__code')?.textContent?.trim()).toBe('en');
    expect(trigger().getAttribute('aria-label')).toBe('Language: English. Change language');
  });
});
