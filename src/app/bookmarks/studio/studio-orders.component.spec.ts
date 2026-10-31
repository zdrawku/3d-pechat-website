import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { StudioOrdersComponent } from './studio-orders.component';
import { BOOKMARK_ENGINE, BOOKMARK_PRINT } from '../engine/engine.token';
import { createBookmarkEngine, createBookmarkPrint } from '../engine/testing/fake-engine';
import type { BookmarkEngine } from '../engine/engine.types';
import { I18nService } from '../../i18n/i18n.service';
import bookmarksMessages from '../../../i18n/bg/bookmarks.json';

describe('StudioOrdersComponent', () => {
  let fixture: ComponentFixture<StudioOrdersComponent>;
  let engine: BookmarkEngine;

  const host = (): HTMLElement => fixture.nativeElement;
  const testid = (id: string): HTMLElement | null => host().querySelector(`[data-testid="${id}"]`);

  beforeEach(async () => {
    engine = await createBookmarkEngine();
    await TestBed.configureTestingModule({
      imports: [StudioOrdersComponent],
      providers: [
        provideNoopAnimations(),
        { provide: BOOKMARK_ENGINE, useValue: () => Promise.resolve(engine) },
        { provide: BOOKMARK_PRINT, useValue: createBookmarkPrint }
      ]
    }).compileComponents();
    TestBed.inject(I18nService).registerPage('bookmarks', bookmarksMessages);
    fixture = TestBed.createComponent(StudioOrdersComponent);
    fixture.detectChanges();
  });

  it('builds the Orders tab from Ignite UI components', () => {
    expect(testid('studio-orders')!.tagName.toLowerCase()).toBe('igx-card');
    expect(host().querySelector('igx-input-group textarea[igxInput]')).not.toBeNull();
    expect(testid('studio-open-pasted')!.hasAttribute('igxButton')).toBeTrue();
    expect(testid('studio-open-order')!.hasAttribute('igxButton')).toBeTrue();
  });

  it('reads the order JSON pasted from the email as the recipe file', async () => {
    const pasted = '{"format":"printkit.bookmark-order","id":"BO-20261031-ABCD"}';
    const readOrder = spyOn(engine, 'readOrder').and.rejectWith(new Error('stop here'));

    const textarea = testid('studio-order-json') as HTMLTextAreaElement;
    textarea.value = `  ${pasted}\n`;
    (testid('studio-open-pasted') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(readOrder).toHaveBeenCalledTimes(1);
    expect(await readOrder.calls.mostRecent().args[0].text()).withContext('trimmed, unchanged').toBe(pasted);
    expect(host().textContent).toContain('stop here');
  });

  it('does nothing with an empty paste', () => {
    const readOrder = spyOn(engine, 'readOrder');
    (testid('studio-open-pasted') as HTMLButtonElement).click();
    expect(readOrder).not.toHaveBeenCalled();
  });
});
