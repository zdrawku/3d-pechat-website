import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { StudioPageComponent } from './studio-page.component';
import { STUDIO_PASSPHRASE_HASH, hashPassphrase } from './studio-gate.service';
import { BOOKMARK_ENGINE } from '../engine/engine.token';
import { createBookmarkEngine } from '../engine/testing/fake-engine';

const STORAGE_KEY = 'bookmark-studio-unlock';
const TEST_PASSPHRASE = 'spec-only passphrase';

describe('StudioPageComponent', () => {
  let fixture: ComponentFixture<StudioPageComponent>;

  const host = (): HTMLElement => fixture.nativeElement;
  const testid = (id: string): HTMLElement | null => host().querySelector(`[data-testid="${id}"]`);

  beforeEach(async () => {
    localStorage.removeItem(STORAGE_KEY);
    const engine = await createBookmarkEngine();
    await TestBed.configureTestingModule({
      imports: [StudioPageComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: STUDIO_PASSPHRASE_HASH, useValue: await hashPassphrase(TEST_PASSPHRASE) },
        { provide: BOOKMARK_ENGINE, useValue: () => Promise.resolve(engine) }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(StudioPageComponent);
    fixture.detectChanges();
  });

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('shows only the passphrase gate, built from Ignite UI, until unlocked', () => {
    expect(testid('studio-gate')!.tagName.toLowerCase()).toBe('igx-card');
    expect(host().querySelector('igx-input-group')).not.toBeNull();
    expect(testid('studio-unlock')!.hasAttribute('igxButton')).toBeTrue();
    expect(host().querySelector('app-bookmarks-page')).withContext('the designer is not even created').toBeNull();
  });

  it('is kept out of search results', () => {
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex, nofollow');
  });

  it('rejects a wrong passphrase', async () => {
    const input = testid('studio-passphrase') as HTMLInputElement;
    input.value = 'nope';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (testid('studio-unlock') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(testid('studio-gate')).not.toBeNull();
    expect(host().textContent).toContain('Грешна парола');
  });

  it('opens the designer with the Studio options and an Orders tab after unlocking, and locks again', async () => {
    const input = testid('studio-passphrase') as HTMLInputElement;
    input.value = TEST_PASSPHRASE;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (testid('studio-unlock') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(testid('studio-gate')).toBeNull();
    expect(host().querySelector('app-bookmarks-page')).not.toBeNull();
    expect(testid('studio-orders')!.closest('[hidden]')).withContext('Orders tab hidden until chosen').not.toBeNull();
    testid('studio-tab-orders')!.click();
    fixture.detectChanges();
    expect(testid('studio-orders')!.closest('[hidden]')).withContext('Orders tab open after a click').toBeNull();
    testid('studio-tab-editor')!.click();
    fixture.detectChanges();
    expect(testid('bookmark-expert')).withContext('admin options').not.toBeNull();
    expect(testid('studio-orders')).withContext('Orders tab').not.toBeNull();

    (testid('studio-lock') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(testid('studio-gate')).not.toBeNull();
  });
});
