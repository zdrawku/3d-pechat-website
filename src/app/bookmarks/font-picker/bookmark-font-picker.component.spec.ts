import { ComponentFixture, TestBed } from '@angular/core/testing';
import { engineOptions } from '@printkit/bookmark-creator';

import { BookmarkFontPickerComponent } from './bookmark-font-picker.component';
import { BOOKMARK_FONT_FACES } from './bookmark-fonts.generated';
import { I18nService } from '../../i18n/i18n.service';
import bookmarksMessages from '../../../i18n/bg/bookmarks.json';

describe('BookmarkFontPickerComponent', () => {
  const fonts = engineOptions().fonts;
  let fixture: ComponentFixture<BookmarkFontPickerComponent>;
  const host = (): HTMLElement => fixture.nativeElement;
  const option = (id: string) => host().querySelector(`[data-testid="bookmark-font-${id}"]`) as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BookmarkFontPickerComponent] }).compileComponents();
    TestBed.inject(I18nService).registerPage('bookmarks', bookmarksMessages);
    fixture = TestBed.createComponent(BookmarkFontPickerComponent);
    fixture.componentRef.setInput('fonts', fonts);
    fixture.componentRef.setInput('value', 'montserrat');
    fixture.detectChanges();
  });

  it('builds the list from Ignite UI buttons, one per engine font, in the engine’s groups', () => {
    expect(host().querySelectorAll('button[igxButton]').length).toBe(fonts.length);
    expect(host().querySelectorAll('.font-group').length).toBe(new Set(fonts.map((f) => f.group)).size);
    expect(option('montserrat').getAttribute('aria-pressed')).toBe('true');
  });

  it('draws the example name in each font until a name is typed, then the name', () => {
    expect(option('rubik').textContent).toContain('Мария');
    fixture.componentRef.setInput('text', 'Ели');
    fixture.detectChanges();
    expect(option('rubik').textContent).toContain('Ели');
  });

  it('disables the fonts without Cyrillic while the name has Cyrillic letters', () => {
    const latinOnly = fonts.filter((f) => !f.cyrillic);
    expect(latinOnly.length).toBeGreaterThan(0);
    expect(latinOnly.every((f) => option(f.id).disabled)).toBeTrue();

    fixture.componentRef.setInput('text', 'Eli');
    fixture.detectChanges();
    expect(latinOnly.some((f) => option(f.id).disabled)).toBeFalse();
  });

  it('tags the thin-stroke fonts „за кратки имена“', () => {
    const thin = fonts.find((f) => f.print === 'check' && f.cyrillic)!;
    expect(option(thin.id).textContent).toContain('за кратки имена');
  });

  it('emits the chosen font', () => {
    const chosen: string[] = [];
    fixture.componentInstance.valueChange.subscribe((id) => chosen.push(id));
    option('oswald').click();
    expect(chosen).toEqual(['oswald']);
  });

  it('has a self-hosted web font for every engine font (run scripts/fetch-bookmark-fonts.mjs when this fails)', () => {
    for (const font of fonts) {
      expect(BOOKMARK_FONT_FACES.some((face) => face.id === font.id)).withContext(font.id).toBeTrue();
      if (font.cyrillic) {
        expect(BOOKMARK_FONT_FACES.some((face) => face.id === font.id && face.file.includes('cyrillic'))).withContext(`${font.id} Cyrillic`).toBeTrue();
      }
    }
  });
});
