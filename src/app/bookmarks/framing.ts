import type { Framing } from './engine/engine.types';

/** Centred, not zoomed — what a picture gets until the visitor drags it. */
export const DEFAULT_FRAMING: Framing = { x: 0.5, y: 0.5, zoom: 1 };
export const MAX_ZOOM = 4;

const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));

/** The picture's box inside its frame, in % of the frame. */
export interface PictureBox {
  width: number;
  height: number;
  left: number;
  top: number;
}

/**
 * Where a picture lies in a frame, with the meaning the contract documents: the
 * picture covers the frame (CSS `background-size: cover`), is scaled by `zoom`,
 * and `x` / `y` are CSS `background-position` fractions. The page's editor and
 * the stub's demo preview both use this, so they agree; the real engine must
 * apply the same meaning.
 */
export function pictureBox(imageAspect: number, frameAspect: number, framing: Framing): PictureBox {
  const width = Math.max(1, imageAspect / frameAspect) * framing.zoom * 100;
  const height = Math.max(1, frameAspect / imageAspect) * framing.zoom * 100;
  return { width, height, left: (100 - width) * framing.x, top: (100 - height) * framing.y };
}

/** Dragging the picture by (dx, dy) px inside a frame of frameW × frameH px: the new framing. */
export function dragged(framing: Framing, dx: number, dy: number, frameW: number, frameH: number, imageAspect: number): Framing {
  const box = pictureBox(imageAspect, frameW / frameH, framing);
  // Pixels the picture can move (negative: it is larger than the frame); none when it fits exactly.
  const spanX = frameW * (1 - box.width / 100);
  const spanY = frameH * (1 - box.height / 100);
  return {
    ...framing,
    x: spanX < -0.5 ? clamp(framing.x + dx / spanX, 0, 1) : framing.x,
    y: spanY < -0.5 ? clamp(framing.y + dy / spanY, 0, 1) : framing.y
  };
}

/** Zoom by a factor, within 1…MAX_ZOOM. */
export function zoomed(framing: Framing, factor: number): Framing {
  return { ...framing, zoom: clamp(framing.zoom * factor, 1, MAX_ZOOM) };
}
