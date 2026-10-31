import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { engineOptions } from '@printkit/bookmark-creator';

import { BookmarkExpertFormComponent, ExpertValues } from './bookmark-expert-form.component';
import { I18nService } from '../../i18n/i18n.service';
import bookmarksMessages from '../../../i18n/bg/bookmarks.json';

describe('BookmarkExpertFormComponent', () => {
  const expert = engineOptions().expert;
  let fixture: ComponentFixture<BookmarkExpertFormComponent>;
  let emitted: ExpertValues[];
  const host = (): HTMLElement => fixture.nativeElement;
  const field = (key: string) => host().querySelector(`[data-testid="expert-${key}"]`) as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BookmarkExpertFormComponent], providers: [provideNoopAnimations()] }).compileComponents();
    TestBed.inject(I18nService).registerPage('bookmarks', bookmarksMessages);
    fixture = TestBed.createComponent(BookmarkExpertFormComponent);
    emitted = [];
    fixture.componentInstance.valuesChange.subscribe((v) => emitted.push(v));
    fixture.componentRef.setInput('options', expert);
    fixture.componentRef.setInput('values', {});
    fixture.detectChanges();
  });

  it('builds a control per engine setting from Ignite UI components', () => {
    const numbers = expert.filter((o) => o.type === 'number');
    const lists = expert.filter((o) => o.type === 'enum');
    expect(host().querySelectorAll('igx-input-group input[igxInput][type="number"]').length).toBe(numbers.length);
    expect(host().querySelectorAll('igx-buttongroup').length).toBe(lists.length);
    expect((host().querySelector('[data-testid="bookmark-expert-reset"]') as HTMLButtonElement).disabled).withContext('nothing changed').toBeTrue();
  });

  it('emits only changed values, kept within the engine’s limits', () => {
    const smooth = expert.find((o) => o.key === 'smooth')!;
    const input = field('smooth') as HTMLInputElement;
    input.value = String(smooth.max! + 5);
    input.dispatchEvent(new Event('change'));
    expect(emitted.at(-1)).toEqual({ smooth: smooth.max! });

    input.value = String(smooth.default);
    input.dispatchEvent(new Event('change'));
    expect(emitted.at(-1)).withContext('the default is no change').toEqual({});
  });

  it('switches a list setting with its buttons', () => {
    const nozzle = expert.find((o) => o.key === 'nozzle')!;
    const other = nozzle.values!.find((v) => v.value !== nozzle.default)!;
    const button = Array.from(field('nozzle').querySelectorAll('button')).find((b) => b.textContent!.trim() === other.label) as HTMLButtonElement;
    button.click();
    expect(emitted.at(-1)).toEqual({ nozzle: other.value });
  });
});
