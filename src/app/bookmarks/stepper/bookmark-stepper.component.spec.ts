import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookmarkStepperComponent } from './bookmark-stepper.component';
import { I18nService } from '../../i18n/i18n.service';
import bookmarksMessages from '../../../i18n/bg/bookmarks.json';

describe('BookmarkStepperComponent', () => {
  let fixture: ComponentFixture<BookmarkStepperComponent>;
  let emitted: (number | null)[];
  const host = (): HTMLElement => fixture.nativeElement;
  const part = (id: string) => host().querySelector(`[data-testid="${id}"]`) as HTMLButtonElement;

  function set(inputs: Record<string, unknown>): void {
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BookmarkStepperComponent] }).compileComponents();
    TestBed.inject(I18nService).registerPage('bookmarks', bookmarksMessages);
    fixture = TestBed.createComponent(BookmarkStepperComponent);
    emitted = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    set({ value: 2, min: 0, max: 6, step: 0.5, label: 'Рамка', zeroLabel: 'Без рамка' });
  });

  it('is built from Ignite UI icon buttons', () => {
    expect(host().querySelectorAll('button[igxIconButton] igx-icon').length).toBe(2);
  });

  it('shows millimetres in the page’s language and steps by the engine’s step', () => {
    expect(part('stepper-value').textContent).toContain('2 мм');
    part('stepper-increase').click();
    part('stepper-decrease').click();
    expect(emitted).toEqual([2.5, 1.5]);
  });

  it('stops at the limits and names zero', () => {
    set({ value: 0 });
    expect(part('stepper-value').textContent).toContain('Без рамка');
    expect(part('stepper-decrease').disabled).toBeTrue();
    set({ value: 6 });
    expect(part('stepper-increase').disabled).toBeTrue();
  });

  it('starts from the largest value when it is on „Авто“, and goes back to it', () => {
    set({ value: null, min: 5.5, max: 12, step: 0.5, autoLabel: 'Авто' });
    expect(part('stepper-value').textContent).toContain('Авто');
    expect(part('stepper-auto')).withContext('already on auto').toBeNull();
    part('stepper-decrease').click();
    expect(emitted).toEqual([11.5]);

    set({ value: 8 });
    part('stepper-auto').click();
    expect(emitted).toEqual([11.5, null]);
  });
});
