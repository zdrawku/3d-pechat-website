import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { BookmarksPageComponent } from './bookmarks-page.component';
import { BOOKMARK_ENGINE } from '../engine/engine.token';
import { createBookmarkEngine, FAKE_COLOURS } from '../engine/testing/fake-engine';
import type { BookmarkEngine, BookmarkRequest } from '../engine/engine.types';
import { SeoService } from '../../services/seo.service';

/** What the specs read from the component (its template members are protected). */
interface Internals {
  request(): BookmarkRequest | null;
  mode(): string;
  setMode(index: number): void;
  setKind: { set(kind: 'split' | 'pictures' | 'names' | 'patterns'): void };
  chooseFor(index: number, input: HTMLInputElement): void;
  setFraming(index: number, framing: { x: number; y: number; zoom: number }): void;
  removePicture(index: number): void;
  splitCount: { set(count: number): void };
  nameCount: { set(count: number): void };
  setNames: { set(names: string[]): void };
  patternLook: { set(id: string): void; (): string };
  sizeChoice: { set(id: string): void };
  customWidth: { set(mm: number): void };
  customHeight: { set(mm: number): void };
  letterMm: { set(mm: number | null): void };
  font: { set(id: string): void };
  expert: { set(values: Record<string, number | string>): void };
  building: { set(building: boolean): void };
  activePatternSlot: { set(index: number): void };
  pickPattern(id: string): void;
  addPatternSlot(): void;
  name: { set(name: string): void };
  namePlace: { set(place: string): void };
  effectivePlace(): string;
  colours(): string[];
}

const PREVIEW_WAIT_MS = 400;
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function pictureFile(name = 'photo.png', type = 'image/png', size = 8): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('BookmarksPageComponent', () => {
  let engine: BookmarkEngine;
  let fixture: ComponentFixture<BookmarksPageComponent>;

  const host = (): HTMLElement => fixture.nativeElement;
  const internals = (): Internals => fixture.componentInstance as unknown as Internals;
  const testid = (id: string): HTMLElement | null => host().querySelector(`[data-testid="${id}"]`);

  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function choosePicture(file: File): Promise<void> {
    const input = testid('bookmark-picture-input') as HTMLInputElement;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event('change'));
    await settle();
    await settle();
  }

  /** Chooses `file` for picture row `index` the way the button does (without opening a real file dialog). */
  async function choosePictureFor(index: number, file: File): Promise<void> {
    internals().chooseFor(index, { click: () => undefined } as HTMLInputElement);
    await choosePicture(file);
  }

  async function create(factory: () => Promise<BookmarkEngine> = () => Promise.resolve(engine)): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [BookmarksPageComponent],
      providers: [provideRouter([]), provideNoopAnimations(), { provide: BOOKMARK_ENGINE, useValue: factory }]
    }).compileComponents();
    fixture = TestBed.createComponent(BookmarksPageComponent);
    fixture.detectChanges();
    await settle();
  }

  beforeEach(async () => {
    engine = await createBookmarkEngine();
    spyOn(engine, 'preview').and.callThrough();
    spyOn(engine, 'suggestColours').and.callThrough();
    await create();
  });

  it('builds the designer from Ignite UI components', () => {
    expect(host().querySelector('igx-tabs')).withContext('mode tabs').not.toBeNull();
    expect(host().querySelectorAll('igx-tab-header').length).withContext('picture, pattern, set').toBe(3);
    expect(host().querySelectorAll('igx-card').length).withContext('cards').toBeGreaterThanOrEqual(5);
    expect(host().querySelectorAll('igx-buttongroup').length).withContext('size, hole, name place').toBeGreaterThanOrEqual(3);
    expect(host().querySelectorAll('button[igxButton], a[igxButton]').length).toBeGreaterThan(0);
    // The colour picker is the one Web Components exception.
    expect(host().querySelectorAll('app-bookmark-colour-picker igc-color-picker').length).withContext('four pickers for a picture').toBe(4);
    expect(host().querySelector('.btn, .card')).withContext('no hand-rolled buttons or cards').toBeNull();
  });

  it('has one H1 and says the picture stays in the browser', () => {
    expect(host().querySelectorAll('h1').length).toBe(1);
    expect(testid('bookmark-privacy')!.textContent).toContain('не се качва');
  });

  it('takes the lists from engine.options(), never from the page', async () => {
    const options = await engine.options();
    expect(host().querySelectorAll('[data-testid^="bookmark-shape-"]').length).toBe(options.shapes.length);
    expect(testid('bookmark-size')!.querySelectorAll('button').length).withContext('presets + custom').toBe(options.sizes.length + 1);
    expect(testid('bookmark-thickness')!.querySelectorAll('button').length).toBe(options.thickness.values.length);
    expect(host().querySelector('input[type="file"]')!.getAttribute('accept')).toBe(options.limits.uploadTypes.join(','));
  });

  it('keeps each shape thumbnail across change detection, so a click on it is not lost', async () => {
    const svg = () => testid('bookmark-shape-rounded')!.querySelector('svg');
    const before = svg();
    expect(before).not.toBeNull();
    internals().name.set('Мария');
    fixture.detectChanges();
    expect(svg()).withContext('the same SVG element').toBe(before);

    (testid('bookmark-shape-rounded') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(testid('bookmark-shape-rounded')!.getAttribute('aria-pressed')).toBe('true');
  });

  it('needs a picture before there is anything to preview or order', async () => {
    expect(internals().request()).toBeNull();
    expect((testid('bookmark-order-open') as HTMLButtonElement).disabled).toBeTrue();
    expect(engine.preview).not.toHaveBeenCalled();

    await choosePicture(pictureFile());
    expect(internals().request()?.mode).toBe('picture');
    expect((testid('bookmark-order-open') as HTMLButtonElement).disabled).toBeFalse();
  });

  it('fills the colour pickers from engine.suggestColours() and lets "Suggest again" ask once more', async () => {
    const picture = pictureFile();
    await choosePicture(picture);
    expect(engine.suggestColours).toHaveBeenCalledWith(picture, 4);
    expect(internals().colours()).toEqual(FAKE_COLOURS);

    (testid('bookmark-suggest') as HTMLButtonElement).click();
    await settle();
    expect(engine.suggestColours).toHaveBeenCalledTimes(2);
  });

  it('refuses a file that is not JPG, PNG or WebP, and one over the size limit', async () => {
    await choosePicture(pictureFile('notes.txt', 'text/plain'));
    expect(testid('bookmark-picture-error')).not.toBeNull();
    expect(internals().request()).toBeNull();

    const { limits } = await engine.options();
    await choosePicture(pictureFile('big.png', 'image/png', limits.uploadMaxBytes + 1));
    expect(testid('bookmark-picture-error')!.textContent).toContain('MB');
    expect(internals().request()).toBeNull();
  });

  it('keeps the picture in memory only: nothing is written to web storage', async () => {
    const local = localStorage.length;
    const session = sessionStorage.length;
    await choosePicture(pictureFile());
    expect(localStorage.length).toBe(local);
    expect(sessionStorage.length).toBe(session);
  });

  it('asks the engine for a preview once the choices rest, and shows it', async () => {
    await choosePicture(pictureFile());
    await sleep(PREVIEW_WAIT_MS);
    await settle();

    expect(engine.preview).toHaveBeenCalledTimes(1);
    const request = (engine.preview as jasmine.Spy).calls.mostRecent().args[0] as BookmarkRequest;
    expect(request.mode).toBe('picture');
    expect(request.colours.length).toBe(4);
    expect(request.hole).toBe('top');
    expect(request.names).toEqual([]);
    expect(testid('bookmark-preview')!.getAttribute('src')).toMatch(/^data:/);
  });

  it('makes the name optional: „Без“ is the default, and typed text is not sent until a place is chosen', async () => {
    await choosePicture(pictureFile());
    const buttons = () => Array.from(testid('bookmark-name-place')!.querySelectorAll('button')).map((b) => b.textContent!.trim());
    expect(buttons()).toEqual(['Без', 'Горе', 'В средата', 'Долу']);
    expect(internals().effectivePlace()).toBe('none');
    expect(testid('bookmark-name-input')).withContext('no field while there is no name').toBeNull();
    expect(internals().request()?.names).toEqual([]);

    // A typed name is kept while „Без“ is chosen, and ignored by the request.
    internals().namePlace.set('top');
    fixture.detectChanges();
    expect(testid('bookmark-name-input')).not.toBeNull();
    internals().name.set('Мария');
    expect(internals().request()).toEqual(jasmine.objectContaining({ names: ['Мария'], namePlace: 'top' }));
    internals().namePlace.set('none');
    fixture.detectChanges();
    expect(testid('bookmark-name-input')).toBeNull();
    expect(internals().request()?.names).toEqual([]);
  });

  it('chooses „Без“ / top / middle / bottom by clicking the buttons', async () => {
    await choosePicture(pictureFile());
    const click = (label: string) => {
      Array.from(testid('bookmark-name-place')!.querySelectorAll('button')).find((b) => b.textContent!.trim() === label)!.click();
      fixture.detectChanges();
    };
    click('В средата');
    expect(internals().effectivePlace()).toBe('middle');
    expect(testid('bookmark-name-input')).not.toBeNull();
    click('Без');
    expect(internals().effectivePlace()).toBe('none');
    expect(testid('bookmark-name-input')).toBeNull();
  });

  it('puts the name into the request, and none when it is empty', async () => {
    await choosePicture(pictureFile());
    internals().namePlace.set('middle');
    internals().name.set('  Мария ');
    expect(internals().request()?.names).toEqual(['Мария']);
    internals().name.set('   ');
    expect(internals().request()?.names).toEqual([]);
  });

  it('switches modes when a tab is clicked (Ignite only does that itself for tabs with panels)', async () => {
    (testid('bookmark-mode-pattern') as HTMLElement).click();
    await settle();
    expect(internals().mode()).toBe('pattern');
    expect(testid('bookmark-pattern')).not.toBeNull();
    expect(testid('bookmark-picture')).toBeNull();

    (testid('bookmark-mode-set') as HTMLElement).click();
    await settle();
    expect(internals().mode()).toBe('set');
    expect(testid('bookmark-set')).not.toBeNull();
    expect(testid('bookmark-mode-set')!.getAttribute('aria-selected')).toBe('true');
  });

  describe('pattern mode', () => {
    beforeEach(async () => {
      internals().setMode(1);
      fixture.detectChanges();
      await settle();
    });

    it('says why when the engine refuses a name on a cut-through pattern', async () => {
      (engine.preview as jasmine.Spy).and.callFake(() => Promise.reject(Object.assign(new Error('names: needs a solid back'), { code: 'REQUEST_INVALID', field: 'names' })));
      internals().namePlace.set('middle');
      internals().name.set('Ели');
      fixture.detectChanges();
      await sleep(PREVIEW_WAIT_MS);
      await settle();
      expect(testid('bookmark-preview-problem')!.textContent).toContain('„С гръб“');
    });

    it('needs no picture, and uses as many colours as the pattern style says', async () => {
      const { patterns } = await engine.options();
      const request = internals().request()!;
      expect(request.mode).toBe('pattern');
      expect(request.pattern).toEqual({ id: patterns[0].id, style: 'cut' });
      expect(request.colours.length).toBe(2);
      expect(host().querySelectorAll('igc-color-picker').length).toBe(2);

      internals().patternLook.set('relief');
      fixture.detectChanges();
      expect(internals().request()!.colours.length).toBe(3);
      expect(host().querySelectorAll('igc-color-picker').length).toBe(3);
    });

    it('offers each style plus a cut-through pattern on a solid back, as picture tiles', () => {
      const tiles = host().querySelectorAll('[data-testid="bookmark-pattern-style"] button[igxButton]');
      expect(Array.from(tiles).map((t) => t.getAttribute('data-testid'))).toEqual(['bookmark-look-cut', 'bookmark-look-cut-back', 'bookmark-look-relief']);
      expect(tiles[0].textContent).toContain('Ажурна');

      (testid('bookmark-look-cut-back') as HTMLButtonElement).click();
      fixture.detectChanges();
      const request = internals().request()!;
      expect(request.pattern).toEqual(jasmine.objectContaining({ style: 'cut', back: true }));
      expect(request.colours.length).withContext('back, pattern, frame').toBe(3);
      const labels = Array.from(host().querySelectorAll('app-bookmark-colour-picker igc-color-picker')).map((p) => p.getAttribute('label'));
      expect(labels).toEqual(['Гръб', 'Шарка', 'Рамка']);
    });

    it('keeps each colour with its role when the look changes', () => {
      internals().patternLook.set('cut');
      const cut = internals().request()!.colours;
      internals().patternLook.set('cut-back');
      const backed = internals().request()!.colours;
      expect(backed.slice(1)).withContext('pattern and frame keep their colours').toEqual(cut);
    });

    it('puts a named cut-through pattern on a solid back by itself, and says so', async () => {
      internals().namePlace.set('middle');
      internals().name.set('Ели');
      fixture.detectChanges();
      await settle();
      expect(internals().patternLook()).toBe('cut-back');
      expect(internals().request()!.pattern).toEqual(jasmine.objectContaining({ back: true }));
      expect(testid('bookmark-auto-back')).not.toBeNull();
    });

    it('keeps shape, size and name when switching modes', async () => {
      internals().namePlace.set('bottom');
      internals().name.set('Ана');
      internals().setMode(0);
      await settle();
      expect(testid('bookmark-name-input')).not.toBeNull();
      expect((testid('bookmark-name-input') as HTMLInputElement).value).toBe('Ана');
    });
  });

  describe('size, thickness, frame and the name’s font', () => {
    beforeEach(async () => {
      internals().setMode(1);
      fixture.detectChanges();
      await settle();
    });

    it('sends the engine’s default thickness and frame, and the chosen ones', async () => {
      const { thickness, border } = await engine.options();
      expect(internals().request()).toEqual(jasmine.objectContaining({ thicknessMm: thickness.default, border: { widthMm: border.widthMm.default } }));

      (Array.from(testid('bookmark-thickness')!.querySelectorAll('button')).at(-1) as HTMLButtonElement).click();
      (testid('bookmark-frame')!.querySelector('[data-testid="stepper-increase"]') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(internals().request()).toEqual(jasmine.objectContaining({
        thicknessMm: thickness.values.at(-1), border: { widthMm: border.widthMm.default + border.widthMm.step }
      }));
    });

    it('takes a custom size within the engine’s limits, and refuses one outside them', async () => {
      const { customSize } = await engine.options();
      internals().sizeChoice.set('custom');
      internals().customWidth.set(45);
      internals().customHeight.set(180);
      fixture.detectChanges();
      expect(testid('bookmark-custom-size')!.querySelectorAll('igx-input-group').length).toBe(2);
      expect(internals().request()!.size).toBe('45x180');

      internals().customWidth.set(customSize.widthMm.max + 1);
      fixture.detectChanges();
      expect(internals().request()).withContext('nothing to preview or order').toBeNull();
      expect(testid('bookmark-custom-size-hint')!.classList).toContain('problem');
    });

    it('sends the font and the letter size only with a name', () => {
      expect(internals().request()!.nameFont).toBeUndefined();
      internals().namePlace.set('top');
      internals().name.set('Ели');
      internals().font.set('oswald');
      fixture.detectChanges();
      expect(internals().request()!.nameFont).toBe('oswald');
      expect(internals().request()!.nameSizeMm).withContext('„Авто“').toBeUndefined();
      internals().letterMm.set(8);
      expect(internals().request()!.nameSizeMm).toBe(8);
      expect(host().querySelector('app-bookmark-font-picker')).not.toBeNull();
    });
  });

  describe('a set of different patterns', () => {
    beforeEach(async () => {
      internals().setMode(2);
      internals().setKind.set('patterns');
      fixture.detectChanges();
      await settle();
    });

    it('sends one pattern per bookmark, with a shared style, up to the engine’s limit', async () => {
      const { patterns, set } = await engine.options();
      expect(internals().request()!.pattern!.id).toEqual([patterns[0].id, patterns[1].id]);

      internals().activePatternSlot.set(1);
      internals().pickPattern(patterns[4].id);
      internals().addPatternSlot();
      fixture.detectChanges();
      expect(internals().request()!.pattern!.id).toEqual([patterns[0].id, patterns[4].id, patterns[1].id]);

      for (let i = 0; i < set.max; i++) {
        internals().addPatternSlot();
      }
      fixture.detectChanges();
      expect((internals().request()!.pattern!.id as string[]).length).toBe(set.max);
      expect(testid('bookmark-pattern-add')).withContext('no add button at the maximum').toBeNull();
    });
  });

  describe('set mode', () => {
    beforeEach(async () => {
      await choosePicture(pictureFile());
      internals().setMode(2);
      fixture.detectChanges();
      await settle();
    });

    it('splits one picture across the set, with a name for each bookmark if wanted', () => {
      internals().splitCount.set(3);
      internals().namePlace.set('top');
      internals().setNames.set(['А', '', 'В', '', '']);
      const request = internals().request()!;
      expect(request.mode).toBe('picture');
      expect(request.split).toBe(3);
      expect(request.names).toEqual(['А', '', 'В']);
    });

    it('makes one bookmark per name for one design', () => {
      internals().setKind.set('names');
      internals().nameCount.set(3);
      internals().setNames.set(['Клас А', 'Клас Б', 'Клас В', '', '']);
      fixture.detectChanges();
      const request = internals().request()!;
      expect(request.split).toBeUndefined();
      expect(request.names).toEqual(['Клас А', 'Клас Б', 'Клас В']);
    });

    it('has no „Без“ for several names: the names are the point of that kind', () => {
      internals().setKind.set('names');
      fixture.detectChanges();
      const labels = Array.from(testid('bookmark-name-place')!.querySelectorAll('button')).map((b) => b.textContent!.trim());
      expect(labels).toEqual(['Горе', 'В средата', 'Долу']);
      expect(internals().effectivePlace()).toBe('middle');
      expect(testid('bookmark-set-name-0')).not.toBeNull();
    });

    it('stays within the set size limits from the engine', async () => {
      const { set } = await engine.options();
      internals().setKind.set('names');
      internals().nameCount.set(set.max);
      fixture.detectChanges();
      expect(testid('bookmark-add-name')).withContext('no add button at the maximum').toBeNull();
    });
  });

  describe('a set of different pictures', () => {
    beforeEach(async () => {
      internals().setMode(2);
      internals().setKind.set('pictures');
      fixture.detectChanges();
      await settle();
    });

    it('asks for the first picture, and offers one more row after each upload, up to the engine’s limit', async () => {
      const { set } = await engine.options();
      expect(set.max).toBe(4);
      expect(host().querySelectorAll('[data-testid^="bookmark-picture-slot-"]').length).toBe(1);
      expect(internals().request()).toBeNull();

      for (let i = 0; i < set.max; i++) {
        await choosePictureFor(i, pictureFile(`p${i}.png`));
        const rows = host().querySelectorAll('[data-testid^="bookmark-picture-slot-"]').length;
        expect(rows).withContext(`after ${i + 1} pictures`).toBe(Math.min(i + 2, set.max));
      }
      expect(testid('bookmark-picture-slot-4')).withContext('no fifth row').toBeNull();
    });

    it('sends every picture, each with its own position, and no single picture or split', async () => {
      const files = [0, 1, 2, 3].map((i) => pictureFile(`p${i}.png`));
      for (const [i, file] of files.entries()) {
        await choosePictureFor(i, file);
      }
      internals().setFraming(2, { x: 0.1, y: 0.9, zoom: 2 });

      const request = internals().request()!;
      expect(request.pictures).toEqual(files);
      expect(request.framing!.length).toBe(4);
      expect(request.framing![2]).toEqual({ x: 0.1, y: 0.9, zoom: 2 });
      expect(request.framing![0]).toEqual({ x: 0.5, y: 0.5, zoom: 1 });
      expect(request.picture).toBeUndefined();
      expect(request.split).toBeUndefined();
    });

    it('shows all four bookmarks in the preview once four pictures are chosen', async () => {
      for (let i = 0; i < 4; i++) {
        await choosePictureFor(i, pictureFile(`p${i}.png`));
      }
      await sleep(PREVIEW_WAIT_MS);
      await settle();
      const request = (engine.preview as jasmine.Spy).calls.mostRecent().args[0] as BookmarkRequest;
      expect(request.pictures!.length).toBe(4);
      const { png } = await (engine.preview as jasmine.Spy).calls.mostRecent().returnValue;
      expect(((await png.text()) as string).match(/<clipPath/g)!.length).withContext('one bookmark per picture').toBe(4);
      expect(testid('bookmark-preview')).not.toBeNull();
    });

    it('gives each picture a name field when names are wanted, and removes a picture cleanly', async () => {
      await choosePictureFor(0, pictureFile('a.png'));
      await choosePictureFor(1, pictureFile('b.png'));
      internals().namePlace.set('bottom');
      fixture.detectChanges();
      expect(host().querySelectorAll('[data-testid^="bookmark-set-name-"]').length).toBe(2);

      internals().removePicture(0);
      fixture.detectChanges();
      expect(internals().request()!.pictures!.map((f) => (f as File).name)).toEqual(['b.png']);
    });
  });

  describe('positioning a picture', () => {
    it('starts centred and sends the position the visitor dragged it to', async () => {
      await choosePicture(pictureFile());
      expect(internals().request()!.framing).toEqual([{ x: 0.5, y: 0.5, zoom: 1 }]);
      internals().setFraming(0, { x: 0.25, y: 0.5, zoom: 1.5 });
      expect(internals().request()!.framing).toEqual([{ x: 0.25, y: 0.5, zoom: 1.5 }]);
    });

    it('gives a new picture a fresh centred position', async () => {
      await choosePicture(pictureFile('one.png'));
      internals().setFraming(0, { x: 0, y: 0, zoom: 3 });
      await choosePicture(pictureFile('two.png'));
      expect(internals().request()!.framing).toEqual([{ x: 0.5, y: 0.5, zoom: 1 }]);
    });
  });

  describe('customers and print files', () => {
    it('offers no print files to customers', () => {
      expect(testid('bookmark-build')).toBeNull();
      expect(testid('bookmark-expert')).toBeNull();
      expect(host().querySelector('a[download]')).toBeNull();
    });

    it('shows the expert options and the build button in the Studio', async () => {
      fixture.componentRef.setInput('admin', true);
      fixture.detectChanges();
      await settle();
      expect(testid('bookmark-expert')).not.toBeNull();
      expect(testid('bookmark-build')).not.toBeNull();
      const { expert } = await engine.options();
      expect(testid('bookmark-expert-form')!.querySelectorAll('[data-testid^="expert-"]').length).toBe(expert.length);
    });

    it('shows an Ignite linear bar while the print files build', async () => {
      fixture.componentRef.setInput('admin', true);
      fixture.detectChanges();
      await settle();
      expect(testid('bookmark-building')).toBeNull();

      internals().building.set(true);
      fixture.detectChanges();
      const bar = testid('bookmark-building');
      expect(bar?.tagName.toLowerCase()).toBe('igx-linear-bar');
      expect(host().querySelector('p[role="status"]')).not.toBeNull();

      internals().building.set(false);
      fixture.detectChanges();
      expect(testid('bookmark-building')).toBeNull();
    });

    it('sends the Studio’s changed expert settings, and none from customers', () => {
      internals().setMode(1);
      internals().expert.set({ smooth: 1 });
      expect(internals().request()!.expert).withContext('customer page').toBeUndefined();
      fixture.componentRef.setInput('admin', true);
      expect(internals().request()!.expert).toEqual({ smooth: 1 });
    });
  });

  describe('page set-up', () => {
    it('applies the page’s SEO, but not inside the Studio', async () => {
      const apply = spyOn(TestBed.inject(SeoService), 'applyPageSeo');
      const again = TestBed.createComponent(BookmarksPageComponent);
      again.detectChanges();
      expect(apply).toHaveBeenCalledWith('bookmarks');

      apply.calls.reset();
      const studio = TestBed.createComponent(BookmarksPageComponent);
      studio.componentRef.setInput('admin', true);
      studio.detectChanges();
      expect(apply).not.toHaveBeenCalled();
    });

    it('says so when the engine cannot start', async () => {
      await create(() => Promise.reject(new Error('no engine')));
      expect(testid('bookmark-engine-error')).not.toBeNull();
    });

    it('shows the shell while the engine has not started (what prerender produces)', async () => {
      await create(() => new Promise<BookmarkEngine>(() => undefined));
      expect(testid('bookmark-engine-loading')).not.toBeNull();
      expect(host().querySelector('h1')).not.toBeNull();
      expect(host().querySelector('igx-tabs')).not.toBeNull();
    });
  });
});
