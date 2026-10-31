import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, PLATFORM_ID, afterNextRender, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { IGX_BUTTON_GROUP_DIRECTIVES, IGX_CARD_DIRECTIVES, IGX_INPUT_GROUP_DIRECTIVES, IGX_TABS_DIRECTIVES, IgxButtonDirective, IgxIconButtonDirective, IgxIconComponent } from 'igniteui-angular';

import { SeoService } from '../../services/seo.service';
import { I18nService } from '../../i18n/i18n.service';
import { LocalizePathPipe, TranslatePipe } from '../../i18n/translate.pipe';
import type { TranslationKey } from '../../i18n/i18n.types';
import bookmarksMessages from '../../../i18n/bg/bookmarks.json';
import { BOOKMARK_ENGINE, BOOKMARK_PRINT } from '../engine/engine.token';
import type { BookmarkEngine, BookmarkRequest, ColourRole, EngineErrorInfo, EngineOptions, Framing, Hex, Hole, PatternStyleId, Place, PreviewWarning, QualityStop } from '../engine/engine.types';
import { DEFAULT_FRAMING } from '../framing';
import { PictureThumb, pictureThumbnail } from '../picture-thumbnail';
import { BookmarkFramerComponent } from '../framer/bookmark-framer.component';
import { BookmarkColourPickerComponent } from '../colour-picker/bookmark-colour-picker.component';
import { BookmarkOrderFormComponent } from '../order-form/bookmark-order-form.component';
import { BookmarkFontPickerComponent } from '../font-picker/bookmark-font-picker.component';
import { BookmarkStepperComponent } from '../stepper/bookmark-stepper.component';
import { BookmarkExpertFormComponent, ExpertValues } from '../studio/bookmark-expert-form.component';

/** The three modes, in tab order. */
type Mode = 'picture' | 'pattern' | 'set';
const MODES: readonly Mode[] = ['picture', 'pattern', 'set'];

/** How long the controls must rest before the preview is asked for again. */
const PREVIEW_DEBOUNCE_MS = 250;

/** Colours the picture pickers start with, before a picture suggests its own. */
const STARTING_COLOURS: Hex[] = ['#c13a0b', '#f0a46b', '#2c6fb5', '#222222'];

/** A pattern's starting colours, by what each colour does: a calm sage pattern and frame on a warm sand back. */
const PATTERN_COLOURS: Record<ColourRole, Hex> = { back: '#eadfc8', pattern: '#4f7f72', border: '#4f7f72' };

/** The font a name gets when none is chosen (the engine's documented default for `nameFont`). */
const ENGINE_DEFAULT_FONT = 'montserrat';

/** The size choice that shows the width and height fields. */
const CUSTOM_SIZE = 'custom';

interface Choice<T extends string = string> {
  id: T;
  label: string;
}

/** A chosen picture, where it was dragged to, and the small copy the framing editor shows. */
interface PictureSlot {
  file: File;
  framing: Framing;
  thumb: PictureThumb | null;
}

/**
 * One of the pattern looks the page offers (variant 2A): each engine style as is, plus,
 * for a style without a back of its own, the same style on a solid back (`pattern.back`).
 */
interface PatternLook {
  id: string;
  style: PatternStyleId;
  back: boolean;
  /** colour roles in the order the request's `colours` lists them */
  roles: ColourRole[];
}

/** One colour picker: a picture's n-th colour, or a pattern colour by its role. */
interface ColourField {
  id: string;
  label: string;
  value: Hex;
}

type SetKind = 'split' | 'pictures' | 'names' | 'patterns';

interface BuiltFile {
  name: string;
  url: string;
}

/**
 * The bookmark creator page (variant A: tabs + sticky live preview; every engine
 * option shown, grouped by what it changes — variant 1D of the options design).
 *
 * It holds NO bookmark logic: it collects choices, builds a `BookmarkRequest`,
 * shows what `engine.preview()` returns and hands the order to the order form.
 * Every list and limit (shapes, sizes, patterns, styles, fonts, thickness, frame,
 * letter sizes, quality stops) comes from `engine.options()` or the preview; only
 * their translated labels live in src/i18n/<lang>/bookmarks.json, keyed by id,
 * with the engine's own label as the fallback.
 *
 * The engine runs in the browser only (it never runs during prerender, which
 * produces the shell), so everything below the tabs waits for it. Pictures stay
 * in memory: no upload, no storage of any kind.
 *
 * `admin` (the hidden Studio) adds the engine's expert options and the print-file
 * download; the customer page never offers print files.
 */
@Component({
  selector: 'app-bookmarks-page',
  imports: [
    IGX_BUTTON_GROUP_DIRECTIVES, IGX_CARD_DIRECTIVES, IGX_INPUT_GROUP_DIRECTIVES, IGX_TABS_DIRECTIVES, IgxButtonDirective, IgxIconButtonDirective, IgxIconComponent,
    NgTemplateOutlet, RouterLink, TranslatePipe, LocalizePathPipe, BookmarkColourPickerComponent, BookmarkFramerComponent, BookmarkOrderFormComponent,
    BookmarkFontPickerComponent, BookmarkStepperComponent, BookmarkExpertFormComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bookmarks-page.component.html',
  styleUrl: './bookmarks-page.component.scss'
})
export class BookmarksPageComponent implements OnInit {
  /** The hidden Studio shows the page with the expert options and print-file download. */
  readonly admin = input(false);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly seo = inject(SeoService);
  private readonly i18n = inject(I18nService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  private readonly startEngine = inject(BOOKMARK_ENGINE);
  private readonly startPrint = inject(BOOKMARK_PRINT);

  private readonly orderAnchor = viewChild<ElementRef<HTMLElement>>('orderAnchor');
  protected readonly modes = MODES;
  protected readonly customSize = CUSTOM_SIZE;

  // ---- engine ----------------------------------------------------------
  protected readonly engine = signal<BookmarkEngine | null>(null);
  protected readonly options = signal<EngineOptions | null>(null);
  protected readonly engineFailed = signal(false);

  // ---- the choices -----------------------------------------------------
  protected readonly mode = signal<Mode>('picture');
  /** The chosen pictures: mode 1 and a split use the first; a set of different pictures, up to `options().set.max`. */
  protected readonly slots = signal<PictureSlot[]>([]);
  protected readonly picture = computed(() => this.slots()[0]?.file ?? null);
  /**
   * What the engine needs of the slots: each file and where it sits. The editor's
   * small copy arriving later changes a slot but not this, so it doesn't ask for a
   * second preview.
   */
  private readonly placed = computed(() => this.slots().map(({ file, framing }) => ({ file, framing })), {
    equal: (a, b) => a.length === b.length && a.every((slot, i) => slot.file === b[i].file && slot.framing === b[i].framing)
  });
  /** The slot the next chosen file goes to. */
  private targetSlot = 0;
  protected readonly pictureError = signal<'tooLarge' | 'wrongType' | null>(null);
  protected readonly shape = signal('');
  /** A preset size id, or `custom` for the width and height fields. */
  protected readonly sizeChoice = signal('');
  protected readonly customWidth = signal(0);
  protected readonly customHeight = signal(0);
  protected readonly thickness = signal(0);
  protected readonly borderMm = signal(0);
  protected readonly patternId = signal('');
  /** The chosen look's id (see `looks`). */
  protected readonly patternLook = signal('');
  /** A set of different patterns: one pattern id per bookmark, and the one the pattern list edits. */
  protected readonly patternIds = signal<string[]>([]);
  protected readonly activePatternSlot = signal(0);
  /** The picture's colours, base first. */
  protected readonly colours = signal<Hex[]>([...STARTING_COLOURS]);
  /** A pattern's colours, by role: switching the look keeps each role's colour. */
  protected readonly patternColours = signal<Record<ColourRole, Hex>>({ ...PATTERN_COLOURS });
  /** Quality ↔ filament, 0–1; null = the engine's default. */
  protected readonly quality = signal<number | null>(null);
  protected readonly suggesting = signal(false);
  protected readonly hole = signal<Hole>('top');
  /** Where the name goes, or 'none' (the default): the name is optional. */
  protected readonly namePlace = signal<'none' | Place>('none');
  /** The name of a single bookmark (modes 1 and 2). */
  protected readonly name = signal('');
  protected readonly font = signal(ENGINE_DEFAULT_FONT);
  /** Capital-letter height in mm; null = the largest that fits (the engine's default). */
  protected readonly letterMm = signal<number | null>(null);
  protected readonly setKind = signal<SetKind>('split');
  protected readonly setBase = signal<'picture' | 'pattern'>('picture');
  protected readonly splitCount = signal(3);
  /** Names of a set, one slot per possible bookmark; only the first `setSize()` are used. */
  protected readonly setNames = signal<string[]>(['', '', '', '', '']);
  /** How many bookmarks the several-names kind makes (one per name). */
  protected readonly nameCount = signal(2);
  /** Set when the page moved a named pattern onto a solid back by itself. */
  protected readonly autoBack = signal(false);

  // ---- preview and order -----------------------------------------------
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly previewBusy = signal(false);
  /** Why the last preview failed (translated), or null. */
  protected readonly previewProblem = signal<string | null>(null);
  protected readonly warnings = signal<PreviewWarning[]>([]);
  /** The quality slider's stops for the last preview, and the one it shows. */
  protected readonly qualityStops = signal<QualityStop[]>([]);
  protected readonly qualityChosen = signal(-1);
  protected readonly orderOpen = signal(false);
  private previewRun = 0;

  // ---- admin -----------------------------------------------------------
  protected readonly expert = signal<ExpertValues>({});
  protected readonly builtFiles = signal<BuiltFile[]>([]);
  protected readonly buildError = signal('');
  protected readonly building = signal(false);

  /** Where the design comes from: the mode, or for a set, its kind (and for names, its base). */
  protected readonly source = computed<'picture' | 'pattern'>(() => {
    const mode = this.mode();
    if (mode === 'set') {
      switch (this.setKind()) {
        case 'names': return this.setBase();
        case 'patterns': return 'pattern';
        default: return 'picture';
      }
    }
    return mode;
  });
  private readonly patternSet = computed(() => this.mode() === 'set' && this.setKind() === 'patterns');

  /** The pattern looks: every engine style, and a style without its own back again on a solid back. */
  protected readonly looks = computed<PatternLook[]>(() => {
    const options = this.options();
    const looks: PatternLook[] = [];
    for (const style of options?.patternStyles ?? []) {
      looks.push({ id: style.id, style: style.id, back: false, roles: style.roles });
      if (options?.patternBack && !style.roles.includes('back')) {
        looks.push({ id: `${style.id}-back`, style: style.id, back: true, roles: ['back', ...style.roles] });
      }
    }
    return looks;
  });
  protected readonly look = computed(() => this.looks().find((l) => l.id === this.patternLook()) ?? this.looks()[0] ?? null);

  /** The colour pickers: the engine's count for a picture, one per colour role of the pattern look. */
  protected readonly colourFields = computed<ColourField[]>(() => {
    if (this.source() === 'picture') {
      const count = this.options()?.pictureColourCount ?? STARTING_COLOURS.length;
      return this.colours().slice(0, count).map((value, i) => ({ id: String(i), label: this.i18n.t('bookmarks.colours.colour', { n: i + 1 }), value }));
    }
    const colours = this.patternColours();
    return (this.look()?.roles ?? []).map((role) => ({ id: role, label: this.roleLabel(role), value: colours[role] }));
  });

  /** The size the engine gets: a preset id, or `<width>x<height>` when the typed size is within the engine's limits. */
  protected readonly customSizeValid = computed(() => {
    const limits = this.options()?.customSize;
    const w = this.customWidth();
    const h = this.customHeight();
    return !!limits && w >= limits.widthMm.min && w <= limits.widthMm.max && h >= limits.heightMm.min && h <= limits.heightMm.max;
  });
  protected readonly size = computed(() => {
    const choice = this.sizeChoice();
    if (choice !== CUSTOM_SIZE) {
      return choice;
    }
    return this.customSizeValid() ? `${this.customWidth()}x${this.customHeight()}` : '';
  });
  /** The bookmark's width and height in mm (the preset's, or the typed ones). */
  private readonly sizeMm = computed(() => {
    if (this.sizeChoice() === CUSTOM_SIZE) {
      return { w: this.customWidth(), h: this.customHeight() };
    }
    const preset = this.options()?.sizes.find((s) => s.id === this.sizeChoice());
    return preset ? { w: preset.widthMm, h: preset.heightMm } : { w: 40, h: 160 };
  });

  /** The typed names, one per bookmark ('' = unnamed); [] = no name at all. */
  private readonly requestNames = computed(() => {
    const set = this.mode() === 'set';
    const typed = (set ? this.setNames().slice(0, this.setSize()) : [this.name()]).map((n) => n.trim());
    return this.effectivePlace() !== 'none' && typed.some((n) => n) ? typed : [];
  });

  /** The request for the engine, or null while it can't be previewed or ordered (the engine isn't up, a picture is missing, the size is invalid). */
  protected readonly request = computed<BookmarkRequest | null>(() => {
    const options = this.options();
    if (!options || !this.shape() || !this.size()) {
      return null;
    }
    const source = this.source();
    const slots = this.placed();
    if (source === 'picture' && !slots.length) {
      return null;
    }
    const mode = this.mode();
    const set = mode === 'set';
    const splitting = set && this.setKind() === 'split';
    const place = this.effectivePlace();
    const names = this.requestNames();

    const request: BookmarkRequest = {
      mode: source,
      shape: this.shape(),
      size: this.size(),
      colours: this.colourFields().map((field) => field.value),
      hole: this.hole(),
      names,
      namePlace: place === 'none' ? 'middle' : place,
      thicknessMm: this.thickness(),
      border: { widthMm: this.borderMm() }
    };
    if (names.length) {
      request.nameFont = this.font();
      if (this.letterMm() !== null) {
        request.nameSizeMm = this.letterMm()!;
      }
    }
    if (this.quality() !== null) {
      request.quality = this.quality()!;
    }
    if (source === 'picture' && set && this.setKind() === 'pictures') {
      request.pictures = slots.map((slot) => slot.file);
      request.framing = slots.map((slot) => slot.framing);
    } else if (source === 'picture') {
      request.picture = slots[0].file;
      request.framing = [slots[0].framing];
    } else {
      const look = this.look();
      request.pattern = {
        id: this.patternSet() ? this.patternIds() : this.patternId(),
        style: look?.style ?? 'cut',
        ...(look?.back ? { back: true } : {})
      };
    }
    if (splitting) {
      request.split = this.splitCount();
    }
    if (this.admin() && Object.keys(this.expert()).length) {
      request.expert = this.expert();
    }
    return request;
  });

  /** How many bookmarks a set has: the split count, one per picture, per name or per pattern. */
  protected readonly setSize = computed(() => {
    switch (this.setKind()) {
      case 'split': return this.splitCount();
      case 'pictures': return Math.max(1, this.slots().length);
      case 'patterns': return this.patternIds().length;
      default: return this.nameCount();
    }
  });
  protected readonly setSlots = computed(() => Array.from({ length: this.setSize() }, (_, index) => index));

  /** Several names (one bookmark per name) can't be nameless, so that kind has no „Без“. */
  protected readonly namesRequired = computed(() => this.mode() === 'set' && this.setKind() === 'names');
  protected readonly effectivePlace = computed<'none' | Place>(() =>
    this.namePlace() === 'none' && this.namesRequired() ? 'middle' : this.namePlace());

  /** The text the font list draws each font with: the first typed name. */
  protected readonly fontSample = computed(() =>
    (this.mode() === 'set' ? this.setNames().slice(0, this.setSize()) : [this.name()]).find((n) => n.trim()) ?? '');

  /** The most pictures a set takes (its size limit, from the engine). */
  protected readonly maxPictures = computed(() => this.options()?.set.max ?? 1);
  /** The picture rows: one, or for a set of different pictures each chosen one plus the next empty one. */
  protected readonly pictureRows = computed(() => {
    if (this.mode() !== 'set' || this.setKind() !== 'pictures') {
      return [0];
    }
    const filled = this.slots().length;
    return Array.from({ length: Math.min(filled + 1, this.maxPictures()) }, (_, index) => index);
  });
  /** The proportions of the framing editor: a bookmark's, or for a split the whole set's. */
  protected readonly frameAspect = computed(() => {
    const { w, h } = this.sizeMm();
    const one = w > 0 && h > 0 ? w / h : 0.25;
    return this.mode() === 'set' && this.setKind() === 'split' ? one * this.splitCount() : one;
  });
  /** The shape's outline for the editor (not for a split: its frame is the whole set). */
  protected readonly frameOutline = computed(() =>
    this.mode() === 'set' && this.setKind() === 'split' ? null : (this.options()?.shapes.find((s) => s.id === this.shape())?.thumbnailSvg ?? null));

  /**
   * The shapes' thumbnails, trusted once per options. Made in the template, a new
   * SafeHtml on every change detection would replace the SVG under the pointer
   * between mousedown and mouseup, and the browser would drop the click.
   */
  protected readonly shapeThumbs = computed(() =>
    new Map((this.options()?.shapes ?? []).map((s) => [s.id, this.sanitizer.bypassSecurityTrustHtml(s.thumbnailSvg)])));

  /** The smallest letters for the nozzle in use (0.4 mm unless the Studio changed it). */
  protected readonly letterRange = computed(() => {
    const names = this.options()?.names;
    const nozzle = Number(this.expert()['nozzle'] ?? 0.4);
    const min = names?.minLetterMm.find((n) => n.nozzle === nozzle)?.mm ?? names?.minLetterMm[0]?.mm ?? 5.5;
    return { min, max: names?.maxLetterMm ?? 12, step: names?.stepMm ?? 0.5 };
  });

  protected readonly uploadAccept = computed(() => (this.options()?.limits.uploadTypes ?? []).join(','));
  protected readonly uploadMaxMb = computed(() => Math.round(((this.options()?.limits.uploadMaxBytes ?? 0) / (1024 * 1024)) * 10) / 10);

  constructor() {
    this.i18n.registerPage('bookmarks', bookmarksMessages);

    // The engine never runs during prerender; the route renders a shell only.
    afterNextRender(() => {
      this.startEngine()
        .then(async (engine) => {
          const options = await engine.options();
          const firstSize = options.sizes[0];
          this.shape.set(options.shapes[0]?.id ?? '');
          this.sizeChoice.set(firstSize?.id ?? '');
          this.customWidth.set(firstSize?.widthMm ?? options.customSize.widthMm.min);
          this.customHeight.set(firstSize?.heightMm ?? options.customSize.heightMm.min);
          this.thickness.set(options.thickness.default);
          this.borderMm.set(options.border.widthMm.default);
          this.patternId.set(options.patterns[0]?.id ?? '');
          this.patternIds.set(options.patterns.slice(0, 2).map((p) => p.id));
          this.patternLook.set(options.patternStyles[0]?.id ?? 'cut');
          if (!options.fonts.some((f) => f.id === ENGINE_DEFAULT_FONT)) {
            this.font.set(options.fonts.find((f) => f.cyrillic)?.id ?? options.fonts[0]?.id ?? '');
          }
          this.engine.set(engine);
          this.options.set(options);
        })
        .catch(() => this.engineFailed.set(true));
    });

    // A name on a pattern needs a solid back (`names.patternNeedsBack`): put a named
    // pattern without one on the same style with a back, and say so.
    effect(() => {
      const named = this.source() === 'pattern' && this.requestNames().length > 0;
      const look = this.look();
      untracked(() => {
        if (!named) {
          this.autoBack.set(false);
          return;
        }
        if (look && !look.roles.includes('back') && this.options()?.names.patternNeedsBack) {
          const backed = this.looks().find((l) => l.style === look.style && l.roles.includes('back'));
          if (backed) {
            this.patternLook.set(backed.id);
            this.autoBack.set(true);
          }
        }
      });
    });

    // Ask for a fresh preview once the choices have rested for a moment.
    effect((onCleanup) => {
      const request = this.request();
      const engine = this.engine();
      if (!request || !engine) {
        untracked(() => {
          this.previewUrl.set(null);
          this.previewBusy.set(false);
        });
        return;
      }
      const timer = setTimeout(() => this.refreshPreview(engine, request), PREVIEW_DEBOUNCE_MS);
      onCleanup(() => clearTimeout(timer));
    });

    this.destroyRef.onDestroy(() => this.revokeBuiltFiles());
  }

  ngOnInit(): void {
    // The Studio is noindex and sets its own meta.
    if (!this.admin()) {
      this.seo.applyPageSeo('bookmarks');
      this.seo.removeStructuredData();
    }
  }

  private async refreshPreview(engine: BookmarkEngine, request: BookmarkRequest): Promise<void> {
    const run = ++this.previewRun;
    this.previewBusy.set(true);
    try {
      const { png, warnings, quality } = await engine.preview(request);
      const url = await readAsDataUrl(png);
      if (run === this.previewRun) {
        this.previewUrl.set(url);
        this.warnings.set(warnings);
        this.qualityStops.set(quality?.stops ?? []);
        this.qualityChosen.set(quality?.chosen ?? -1);
        this.previewProblem.set(null);
      }
    } catch (error) {
      if (run === this.previewRun) {
        this.previewProblem.set(this.errorText(error, request));
      }
    } finally {
      if (run === this.previewRun) {
        this.previewBusy.set(false);
      }
    }
  }

  // ---- labels ----------------------------------------------------------

  /** The translated label of an engine item, falling back to the engine's own (English) label. */
  protected label(group: 'shapes' | 'patterns' | 'patternLooks' | 'patternLookHints' | 'quality', id: string, fallback: string): string {
    const key = `bookmarks.labels.${group}.${id}`;
    const text = this.i18n.t(key as TranslationKey);
    return text === key ? fallback : text;
  }

  /** What a pattern colour does („Гръб“, „Шарка“, „Рамка“). */
  private roleLabel(role: ColourRole): string {
    const key = `bookmarks.colours.roles.${role}`;
    const text = this.i18n.t(key as TranslationKey);
    return text === key ? role : text;
  }

  /** A number in the page's language: 1.1 → „1,1“. */
  protected number(value: number): string {
    return this.i18n.formatNumber(value);
  }

  /** Millimetres in the page's language: 1.6 → „1,6 мм“. */
  protected mm(value: number): string {
    return this.i18n.t('bookmarks.units.mm', { n: this.i18n.formatNumber(value) });
  }

  /** A warning's translated text by its stable code, falling back to the engine's message. */
  protected warningText(warning: PreviewWarning): string {
    const key = `bookmarks.warnings.${warning.code}`;
    const text = this.i18n.t(key as TranslationKey);
    if (text === key) {
      return warning.message;
    }
    return warning.bookmark ? this.i18n.t('bookmarks.warnings.onBookmark', { n: warning.bookmark, text }) : text;
  }

  /**
   * Why the engine refused a preview, translated by its code. A name on a pattern
   * without a solid back gets its own advice; an unknown code the general message.
   */
  private errorText(error: unknown, request: BookmarkRequest): string {
    const { code, field } = (error ?? {}) as Partial<EngineErrorInfo>;
    if (code === 'REQUEST_INVALID' && field === 'names' && request.mode === 'pattern') {
      return this.i18n.t('bookmarks.errors.namesNeedBack');
    }
    const key = `bookmarks.errors.${code}`;
    const text = this.i18n.t(key as TranslationKey);
    return text === key ? this.i18n.t('bookmarks.design.previewError') : text;
  }

  protected readonly modeLabel = (mode: Mode): TranslationKey => `bookmarks.modes.${mode}`;

  protected sizeChoices = computed<Choice[]>(() => [
    ...(this.options()?.sizes ?? []).map((s) => ({ id: s.id, label: s.label })),
    { id: CUSTOM_SIZE, label: this.i18n.t('bookmarks.size.custom') }
  ]);
  protected thicknessChoices = computed<Choice[]>(() =>
    (this.options()?.thickness.values ?? []).map((v) => ({ id: String(v), label: this.i18n.formatNumber(v) })));
  protected qualityChoices = computed<Choice[]>(() =>
    this.qualityStops().map((stop) => ({ id: String(stop.value), label: this.label('quality', stop.id, stop.id) })));
  protected readonly chosenStop = computed(() => this.qualityStops()[this.qualityChosen()] ?? null);
  protected countChoices = computed<Choice[]>(() =>
    (this.options()?.set.splitCounts ?? []).map((n) => ({ id: String(n), label: String(n) })));
  /** The pattern the pattern list shows as chosen: the single one, or the active slot's in a set of patterns. */
  protected readonly shownPattern = computed(() => (this.patternSet() ? this.patternIds()[this.activePatternSlot()] : this.patternId()));

  // ---- setters used by the template ------------------------------------
  protected readonly pickSize = (id: string) => this.sizeChoice.set(id);
  protected readonly pickThickness = (id: string) => this.thickness.set(Number(id));
  protected readonly pickQuality = (id: string) => this.quality.set(Number(id));
  protected readonly pickHole = (id: string) => this.hole.set(id as Hole);
  protected readonly pickPlace = (id: string) => this.namePlace.set(id as 'none' | Place);
  protected readonly pickSetKind = (id: string) => this.setKind.set(id as SetKind);
  protected readonly pickSetBase = (id: string) => this.setBase.set(id as 'picture' | 'pattern');
  protected readonly pickSplitCount = (id: string) => this.splitCount.set(Number(id));

  protected setMode(index: number): void {
    this.mode.set(MODES[index] ?? 'picture');
  }

  protected pickLook(id: string): void {
    this.patternLook.set(id);
  }

  protected pickPattern(id: string): void {
    if (this.patternSet()) {
      const slot = this.activePatternSlot();
      this.patternIds.update((ids) => ids.map((p, i) => (i === slot ? id : p)));
    } else {
      this.patternId.set(id);
    }
  }

  protected addPatternSlot(): void {
    const options = this.options();
    if (!options || this.patternIds().length >= options.set.max) {
      return;
    }
    // The next pattern not in the set yet, so a new bookmark looks different straight away.
    const unused = options.patterns.find((p) => !this.patternIds().includes(p.id)) ?? options.patterns[0];
    this.patternIds.update((ids) => [...ids, unused.id]);
    this.activePatternSlot.set(this.patternIds().length - 1);
  }

  protected removePatternSlot(index: number): void {
    if (this.patternIds().length <= (this.options()?.set.min ?? 1)) {
      return;
    }
    this.patternIds.update((ids) => ids.filter((_, i) => i !== index));
    this.activePatternSlot.update((active) => Math.min(active, this.patternIds().length - 1));
  }

  protected setColour(id: string, value: Hex): void {
    if (this.source() === 'picture') {
      const slot = Number(id);
      this.colours.update((colours) => colours.map((c, i) => (i === slot ? value : c)));
    } else {
      this.patternColours.update((colours) => ({ ...colours, [id as ColourRole]: value }));
    }
  }

  protected setCustomSize(side: 'width' | 'height', event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    (side === 'width' ? this.customWidth : this.customHeight).set(Number.isFinite(value) ? value : 0);
  }

  protected setName(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }

  protected setNameAt(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.setNames.update((names) => names.map((n, i) => (i === index ? value : n)));
  }

  protected addName(): void {
    const max = this.options()?.set.max ?? 5;
    this.nameCount.update((count) => Math.min(count + 1, max));
  }

  protected removeName(index: number): void {
    const min = this.options()?.set.min ?? 1;
    if (this.nameCount() <= min) {
      return;
    }
    // Close the gap: the names after the removed one move up.
    this.setNames.update((names) => [...names.filter((_, i) => i !== index), '']);
    this.nameCount.update((count) => count - 1);
  }

  // ---- the picture (kept in memory only) ---------------------------------

  /** Opens the file chooser for slot `index` (one hidden input serves every row). */
  protected chooseFor(index: number, input: HTMLInputElement): void {
    this.targetSlot = index;
    input.click();
  }

  protected async onPicture(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    const limits = this.options()?.limits;
    if (!file || !limits) {
      return;
    }
    if (!limits.uploadTypes.includes(file.type)) {
      this.pictureError.set('wrongType');
      return;
    }
    if (file.size > limits.uploadMaxBytes) {
      this.pictureError.set('tooLarge');
      return;
    }
    this.pictureError.set(null);
    const index = Math.min(this.targetSlot, this.slots().length);
    const slot: PictureSlot = { file, framing: { ...DEFAULT_FRAMING }, thumb: null };
    this.slots.update((slots) => (index < slots.length ? slots.map((s, i) => (i === index ? slot : s)) : [...slots, slot]));
    if (index === 0) {
      void this.suggestColours();
    }
    // The editor shows a small copy; it appears as soon as it is ready (the slot may have moved meanwhile).
    const thumb = await pictureThumbnail(file);
    this.slots.update((slots) => slots.map((s) => (s.file === file ? { ...s, thumb } : s)));
  }

  protected removePicture(index: number): void {
    this.slots.update((slots) => slots.filter((_, i) => i !== index));
    this.pictureError.set(null);
  }

  protected setFraming(index: number, framing: Framing): void {
    this.slots.update((slots) => slots.map((s, i) => (i === index ? { ...s, framing } : s)));
  }

  protected async suggestColours(): Promise<void> {
    const engine = this.engine();
    const picture = this.picture();
    if (!engine || !picture) {
      return;
    }
    this.suggesting.set(true);
    try {
      const suggested = await engine.suggestColours(picture, this.options()?.pictureColourCount);
      this.colours.update((current) => current.map((colour, i) => suggested[i] ?? colour));
    } catch {
      // Keep the colours the visitor already has.
    } finally {
      this.suggesting.set(false);
    }
  }

  // ---- ordering ---------------------------------------------------------

  protected openOrder(): void {
    this.orderOpen.set(true);
    if (isPlatformBrowser(this.platformId)) {
      // Wait for the form to render, then bring it into view.
      setTimeout(() => this.orderAnchor()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    }
  }

  // ---- admin: print files (lazy, only after unlocking) --------------------

  protected async buildFiles(): Promise<void> {
    const request = this.request();
    if (!request) {
      return;
    }
    this.building.set(true);
    this.buildError.set('');
    this.revokeBuiltFiles();
    try {
      const print = await this.startPrint();
      const nozzle = this.expert()['nozzle'] === 0.2 ? 0.2 : 0.4;
      const built = await print.build(request, { nozzle });
      const files = [
        { name: built.threeMfName, file: built.threeMf },
        ...built.stls,
        { name: 'bookmark.zip', file: built.zip }
      ];
      this.builtFiles.set(files.map(({ name, file }) => ({ name, url: URL.createObjectURL(file) })));
    } catch (error) {
      this.buildError.set(error instanceof Error ? error.message : String(error));
    } finally {
      this.building.set(false);
    }
  }

  private revokeBuiltFiles(): void {
    for (const { url } of this.builtFiles()) {
      URL.revokeObjectURL(url);
    }
    this.builtFiles.set([]);
  }
}

/** A Blob as a data: URL — the site's CSP allows data: images, not blob: ones. */
function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
