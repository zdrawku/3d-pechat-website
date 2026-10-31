import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IgxButtonDirective, IgxIconButtonDirective, IgxIconComponent } from 'igniteui-angular';

import { TranslatePipe } from '../../i18n/translate.pipe';
import type { Framing } from '../engine/engine.types';
import { DEFAULT_FRAMING, dragged, pictureBox, zoomed } from '../framing';
import type { PictureThumb } from '../picture-thumbnail';

/** Pixels one arrow-key press moves the picture. */
const KEY_STEP_PX = 6;
const ZOOM_STEP = 1.2;

/**
 * Positions a picture inside the shape with the mouse: drag to move it, the
 * wheel or the + / − buttons to zoom, arrow keys and + / − from the keyboard.
 *
 * The frame has the bookmark's proportions (`frameAspect`) with the shape's
 * outline on top, and shows the picture exactly as the engine is asked to place
 * it (`Framing`, see framing.ts) — the editor only collects `x`, `y` and `zoom`;
 * the engine does the real cropping.
 */
@Component({
  selector: 'app-bookmark-framer',
  imports: [IgxButtonDirective, IgxIconButtonDirective, IgxIconComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="framer-wrap">
      <div #frame class="framer" tabindex="0" role="group" data-testid="bookmark-framer"
           [style.aspect-ratio]="frameAspect()" [class.is-dragging]="dragging()"
           [attr.aria-label]="'bookmarks.framer.label' | t" [attr.aria-describedby]="'framer-hint-' + uid"
           (pointerdown)="onDown($event)" (pointermove)="onMove($event)" (pointerup)="onUp($event)"
           (pointercancel)="onUp($event)" (wheel)="onWheel($event)" (keydown)="onKey($event)">
        <img [src]="thumb().url" alt="" draggable="false"
             [style.width.%]="box().width" [style.height.%]="box().height" [style.left.%]="box().left" [style.top.%]="box().top" />
        @if (outline(); as svg) {
          <span class="framer-outline" aria-hidden="true" [innerHTML]="svg"></span>
        }
      </div>
      <div class="framer-tools">
        <button igxIconButton="flat" type="button" [attr.aria-label]="'bookmarks.framer.zoomOut' | t"
                [disabled]="framing().zoom <= 1" (click)="zoom(1 / ZOOM_STEP)" data-testid="bookmark-zoom-out">
          <igx-icon>zoom_out</igx-icon>
        </button>
        <button igxIconButton="flat" type="button" [attr.aria-label]="'bookmarks.framer.zoomIn' | t"
                (click)="zoom(ZOOM_STEP)" data-testid="bookmark-zoom-in">
          <igx-icon>zoom_in</igx-icon>
        </button>
        <button igxButton="flat" type="button" [disabled]="isCentred()" (click)="reset()" data-testid="bookmark-centre">
          <igx-icon>center_focus_strong</igx-icon>
          {{ 'bookmarks.framer.reset' | t }}
        </button>
      </div>
      <p class="framer-hint" [id]="'framer-hint-' + uid">{{ 'bookmarks.framer.hint' | t }}</p>
    </div>
  `,
  styleUrl: './bookmark-framer.component.scss'
})
export class BookmarkFramerComponent {
  /** The picture, as the small copy made for this editor. */
  readonly thumb = input.required<PictureThumb>();
  /** The frame's width ÷ height: the bookmark's size (a split picture: the whole set's). */
  readonly frameAspect = input.required<number>();
  /** The shape's outline as SVG (the engine's thumbnail), or null. */
  readonly outlineSvg = input<string | null>(null);
  readonly framing = input<Framing>(DEFAULT_FRAMING);
  readonly framingChange = output<Framing>();

  protected readonly ZOOM_STEP = ZOOM_STEP;
  protected readonly uid = Math.random().toString(36).slice(2, 8);
  protected readonly dragging = signal(false);

  private readonly frame = viewChild.required<ElementRef<HTMLElement>>('frame');
  private readonly sanitizer = inject(DomSanitizer);
  private last: { x: number; y: number } | null = null;

  protected readonly box = computed(() => pictureBox(this.thumb().aspect, this.frameAspect(), this.framing()));
  protected readonly isCentred = computed(() => {
    const { x, y, zoom } = this.framing();
    return x === DEFAULT_FRAMING.x && y === DEFAULT_FRAMING.y && zoom === DEFAULT_FRAMING.zoom;
  });
  /** The engine's own thumbnail SVG (package content, not user input), stretched to the frame and drawn as an outline. */
  protected readonly outline = computed<SafeHtml | null>(() => {
    const svg = this.outlineSvg();
    return svg ? this.sanitizer.bypassSecurityTrustHtml(svg.replace('<svg ', '<svg preserveAspectRatio="none" ')) : null;
  });

  protected onDown(event: PointerEvent): void {
    this.last = { x: event.clientX, y: event.clientY };
    this.dragging.set(true);
    try {
      this.frame().nativeElement.setPointerCapture(event.pointerId);
    } catch {
      // A pointer the browser no longer knows (it ended already): dragging still works without capture.
    }
    event.preventDefault();
  }

  protected onMove(event: PointerEvent): void {
    if (!this.last) {
      return;
    }
    this.move(event.clientX - this.last.x, event.clientY - this.last.y);
    this.last = { x: event.clientX, y: event.clientY };
  }

  protected onUp(event: PointerEvent): void {
    this.last = null;
    this.dragging.set(false);
    const element = this.frame().nativeElement;
    if (element.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }
  }

  protected onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.zoom(event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP);
  }

  protected onKey(event: KeyboardEvent): void {
    const arrows: Record<string, [number, number]> = {
      ArrowLeft: [-KEY_STEP_PX, 0], ArrowRight: [KEY_STEP_PX, 0], ArrowUp: [0, -KEY_STEP_PX], ArrowDown: [0, KEY_STEP_PX]
    };
    if (arrows[event.key]) {
      // The arrow moves the view that way, so the picture goes the opposite way.
      this.move(-arrows[event.key][0], -arrows[event.key][1]);
    } else if (event.key === '+' || event.key === '=') {
      this.zoom(ZOOM_STEP);
    } else if (event.key === '-') {
      this.zoom(1 / ZOOM_STEP);
    } else {
      return;
    }
    event.preventDefault();
  }

  protected zoom(factor: number): void {
    this.framingChange.emit(zoomed(this.framing(), factor));
  }

  protected reset(): void {
    this.framingChange.emit({ ...DEFAULT_FRAMING });
  }

  private move(dx: number, dy: number): void {
    const { width, height } = this.frame().nativeElement.getBoundingClientRect();
    if (width && height) {
      this.framingChange.emit(dragged(this.framing(), dx, dy, width, height, this.thumb().aspect));
    }
  }
}
