import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookmarkFramerComponent } from './bookmark-framer.component';
import { I18nService } from '../../i18n/i18n.service';
import bookmarksMessages from '../../../i18n/bg/bookmarks.json';
import type { Framing } from '../engine/engine.types';

const ONE_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=';

describe('BookmarkFramerComponent', () => {
  let fixture: ComponentFixture<BookmarkFramerComponent>;
  let emitted: Framing[];

  const host = (): HTMLElement => fixture.nativeElement;
  const frame = (): HTMLElement => host().querySelector('[data-testid="bookmark-framer"]')!;
  const testid = (id: string): HTMLButtonElement => host().querySelector(`[data-testid="${id}"]`)!;
  const pointer = (type: string, x: number, y = 0) =>
    frame().dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 1, bubbles: true, cancelable: true }));

  beforeEach(() => {
    TestBed.inject(I18nService).registerPage('bookmarks', bookmarksMessages);
    fixture = TestBed.createComponent(BookmarkFramerComponent);
    fixture.componentRef.setInput('thumb', { url: ONE_PIXEL, aspect: 1.5 });
    fixture.componentRef.setInput('frameAspect', 0.25);
    fixture.componentRef.setInput('outlineSvg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 100"><path d="M6 4h28v92H6z"/></svg>');
    fixture.componentRef.setInput('framing', { x: 0.5, y: 0.5, zoom: 1 });
    emitted = [];
    fixture.componentInstance.framingChange.subscribe((f) => emitted.push(f));
    fixture.detectChanges();
  });

  it('shows the picture in a frame with the bookmark’s proportions and the shape’s outline on top', () => {
    expect(parseFloat(frame().style.aspectRatio)).toBe(0.25);
    expect(host().querySelector('img')!.getAttribute('src')).toBe(ONE_PIXEL);
    expect(host().querySelector('.framer-outline svg')!.getAttribute('preserveAspectRatio')).toBe('none');
  });

  it('places the picture where the framing says (centred: a wide picture overflows both sides)', () => {
    const style = host().querySelector('img')!.style;
    expect(parseFloat(style.height)).toBeCloseTo(100);
    expect(parseFloat(style.width)).toBeCloseTo(600);
    expect(parseFloat(style.left)).toBeCloseTo(-250);
  });

  it('moves with the mouse: dragging the picture right shows more of its left side', () => {
    pointer('pointerdown', 100);
    pointer('pointermove', 120);
    pointer('pointerup', 120);
    expect(emitted.length).toBeGreaterThan(0);
    expect(emitted[emitted.length - 1].x).toBeLessThan(0.5);
    expect(emitted[emitted.length - 1].zoom).toBe(1);
  });

  it('ignores mouse movement when no button is held', () => {
    pointer('pointermove', 120);
    expect(emitted).toEqual([]);
  });

  it('zooms with the wheel and the + / − buttons, and never below 1', () => {
    frame().dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true }));
    expect(emitted[0].zoom).toBeGreaterThan(1);

    testid('bookmark-zoom-in').click();
    expect(emitted[1].zoom).toBeGreaterThan(1);
    expect(testid('bookmark-zoom-out').disabled).withContext('already at 1').toBeTrue();
  });

  it('can be driven from the keyboard', () => {
    frame().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    expect(emitted.length).toBe(1);
    expect(emitted[0].x).toBeGreaterThan(0.5); // the view moves right, the picture goes left
    frame().dispatchEvent(new KeyboardEvent('keydown', { key: '+', bubbles: true, cancelable: true }));
    expect(emitted[1].zoom).toBeGreaterThan(1);
    const other = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
    frame().dispatchEvent(other);
    expect(other.defaultPrevented).withContext('other keys are left alone').toBeFalse();
  });

  it('centres again with the button, which is off while already centred', () => {
    expect(testid('bookmark-centre').disabled).toBeTrue();
    fixture.componentRef.setInput('framing', { x: 0.1, y: 0.7, zoom: 2 });
    fixture.detectChanges();
    expect(testid('bookmark-centre').disabled).toBeFalse();
    testid('bookmark-centre').click();
    expect(emitted).toEqual([{ x: 0.5, y: 0.5, zoom: 1 }]);
  });

  it('is built from Ignite UI buttons and icons, and says how to use it', () => {
    expect(testid('bookmark-zoom-in').hasAttribute('igxIconButton')).toBeTrue();
    expect(testid('bookmark-centre').hasAttribute('igxButton')).toBeTrue();
    expect(host().querySelectorAll('igx-icon').length).toBe(3);
    expect(host().querySelector('.framer-hint')!.textContent).toContain('Влачете');
    expect(frame().getAttribute('aria-describedby')).toBe(host().querySelector('.framer-hint')!.id);
  });
});
