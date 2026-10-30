import { DEFAULT_FRAMING, MAX_ZOOM, dragged, pictureBox, zoomed } from './framing';

describe('framing', () => {
  const FRAME_ASPECT = 0.25; // a 40 × 160 mm bookmark

  it('centres a picture by default: a wide picture overflows left and right equally, filling the height', () => {
    const box = pictureBox(1.5, FRAME_ASPECT, DEFAULT_FRAMING);
    expect(box.height).toBeCloseTo(100);
    expect(box.width).toBeCloseTo(600); // 1.5 / 0.25 frames wide
    expect(box.left).toBeCloseTo(-250);
    expect(box.top).toBeCloseTo(0);
  });

  it('fills the width of a frame for a tall picture and overflows top and bottom', () => {
    const box = pictureBox(0.1, FRAME_ASPECT, DEFAULT_FRAMING);
    expect(box.width).toBeCloseTo(100);
    expect(box.height).toBeCloseTo(250);
    expect(box.top).toBeCloseTo(-75);
  });

  it('keeps the picture’s own proportions at every zoom', () => {
    for (const zoom of [1, 1.7, 3]) {
      const box = pictureBox(1.5, FRAME_ASPECT, { x: 0.2, y: 0.8, zoom });
      expect((box.width * FRAME_ASPECT) / box.height).toBeCloseTo(1.5);
    }
  });

  it('x and y = 0 / 1 put the picture’s left / right edge against the frame', () => {
    expect(pictureBox(1.5, FRAME_ASPECT, { x: 0, y: 0.5, zoom: 1 }).left).toBeCloseTo(0);
    const right = pictureBox(1.5, FRAME_ASPECT, { x: 1, y: 0.5, zoom: 1 });
    expect(right.left + right.width).toBeCloseTo(100);
  });

  describe('dragging', () => {
    it('moves the picture with the mouse: dragging right shows more of the left', () => {
      // A 60 px wide frame, 240 px tall; a wide picture overflows horizontally only.
      const moved = dragged(DEFAULT_FRAMING, 30, 0, 60, 240, 1.5);
      expect(moved.x).toBeLessThan(0.5);
      expect(moved.y).toBe(0.5); // it fills the height: nothing to move vertically
    });

    it('moves by exactly the pixels dragged', () => {
      const before = pictureBox(1.5, 60 / 240, DEFAULT_FRAMING);
      const after = pictureBox(1.5, 60 / 240, dragged(DEFAULT_FRAMING, 20, 0, 60, 240, 1.5));
      expect(((after.left - before.left) / 100) * 60).toBeCloseTo(20);
    });

    it('stops at the picture’s edges', () => {
      expect(dragged(DEFAULT_FRAMING, 10_000, 0, 60, 240, 1.5).x).toBe(0);
      expect(dragged(DEFAULT_FRAMING, -10_000, 0, 60, 240, 1.5).x).toBe(1);
    });

    it('does not move a picture that has no room, and moves in both ways once zoomed', () => {
      const exact = dragged(DEFAULT_FRAMING, 50, 50, 60, 240, 0.25);
      expect(exact).toEqual(DEFAULT_FRAMING);
      const zoomedIn = dragged({ x: 0.5, y: 0.5, zoom: 2 }, 10, 10, 60, 240, 0.25);
      expect(zoomedIn.x).not.toBe(0.5);
      expect(zoomedIn.y).not.toBe(0.5);
    });
  });

  it('zooms within 1 … MAX_ZOOM', () => {
    expect(zoomed(DEFAULT_FRAMING, 0.5).zoom).toBe(1);
    expect(zoomed(DEFAULT_FRAMING, 1.25).zoom).toBeCloseTo(1.25);
    expect(zoomed({ ...DEFAULT_FRAMING, zoom: 3 }, 10).zoom).toBe(MAX_ZOOM);
  });
});
