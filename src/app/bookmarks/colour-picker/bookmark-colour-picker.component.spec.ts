import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookmarkColourPickerComponent } from './bookmark-colour-picker.component';
import type { Hex } from '../engine/engine.types';

describe('BookmarkColourPickerComponent', () => {
  let fixture: ComponentFixture<BookmarkColourPickerComponent>;
  const picker = (): HTMLElement & { value: string } => fixture.nativeElement.querySelector('igc-color-picker');

  beforeEach(() => {
    fixture = TestBed.createComponent(BookmarkColourPickerComponent);
    fixture.componentRef.setInput('label', 'Цвят 1');
    fixture.componentRef.setInput('value', '#c13a0b');
    fixture.detectChanges();
  });

  it('renders Ignite UI Web Components’ igc-color-picker with the label and value', () => {
    expect(picker()).not.toBeNull();
    expect(picker().getAttribute('label')).toBe('Цвят 1');
    expect(picker().value).toBe('#c13a0b');
  });

  it('emits the picked colour as lower-case #rrggbb while it changes', () => {
    const emitted: Hex[] = [];
    fixture.componentInstance.valueChange.subscribe((hex) => emitted.push(hex));

    picker().value = '#112233';
    picker().dispatchEvent(new CustomEvent('igcInput'));
    picker().value = '#AABBCC';
    picker().dispatchEvent(new CustomEvent('igcChange'));
    expect(emitted).toEqual(['#112233', '#aabbcc']);
  });

  it('ignores anything that is not a plain hex colour', () => {
    const emitted: Hex[] = [];
    fixture.componentInstance.valueChange.subscribe((hex) => emitted.push(hex));
    picker().value = 'rgba(0, 0, 0, 0.5)';
    picker().dispatchEvent(new CustomEvent('igcInput'));
    expect(emitted).toEqual([]);
  });
});
