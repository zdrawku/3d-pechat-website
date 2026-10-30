import { createBookmarkEngine } from './stub-engine';
import type { BookmarkEngine, BookmarkRequest } from './engine.types';

/** The stub's demo preview is a throw-away sketch, but it must follow the request so the page's wiring can be seen working. */
describe('stub engine (temporary)', () => {
  let engine: BookmarkEngine;

  const request = (change: Partial<BookmarkRequest> = {}): BookmarkRequest => ({
    mode: 'pattern',
    pattern: { id: 'waves', style: 'cut' },
    shape: 'rectangle',
    size: '40x160',
    colours: ['#c13a0b', '#2c6fb5'],
    hole: 'top',
    names: [],
    namePlace: 'middle',
    ...change
  });
  const svg = async (req: BookmarkRequest): Promise<string> => (await engine.preview(req)).png.text();

  /** A real, decodable picture (wide, so a bookmark shows only part of it). */
  const png = (): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    canvas.width = 90;
    canvas.height = 30;
    canvas.getContext('2d')!.fillRect(0, 0, 90, 30);
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/png'));
  };

  beforeEach(async () => {
    engine = await createBookmarkEngine();
  });

  it('describes the shapes, sizes and limits the page builds its controls from', async () => {
    const options = await engine.options();
    expect(options.shapes.length).toBe(10);
    expect(options.shapes.every((s) => s.thumbnailSvg.includes('<path'))).toBeTrue();
    expect(options.sizes.map((s) => s.id)).toEqual(['40x160', '50x160']);
    expect(options.limits.orderMaxBytes).toBe(1024 * 1024);
  });

  it('draws a different outline for each shape', async () => {
    const shapes = (await engine.options()).shapes.map((s) => s.id);
    const drawings = await Promise.all(shapes.map((shape) => svg(request({ shape }))));
    expect(new Set(drawings).size).toBe(shapes.length);
  });

  it('follows the size, colours, hole and name', async () => {
    const base = await svg(request());
    expect(base).toContain('viewBox="0 0 120 480"');
    expect(await svg(request({ size: '50x160' }))).toContain('viewBox="0 0 150 480"');
    expect(await svg(request({ colours: ['#112233', '#445566'] }))).toContain('#112233');
    expect(base).toContain('<circle');
    expect(await svg(request({ hole: 'none' }))).not.toContain('<circle');
    expect(await svg(request({ names: ['Мария & Ко'] }))).toContain('Мария &amp; Ко');
    expect(base).not.toContain('<text x="60" y="240"');
  });

  it('puts the hanging hole inside every shape, not on its edge', async () => {
    // Where each outline begins and ends (in % of its height), by shape: the crown / tip / wavy end is not at 4 % and 96 %.
    const ends: Record<string, [number, number]> = { arch: [10, 96], point: [4, 96], wave: [4, 92], notched: [4, 86], oval: [4, 96] };
    for (const { id } of (await engine.options()).shapes) {
      const cy = async (hole: 'top' | 'bottom') => Number(/<circle cx="[\d.]+" cy="([\d.]+)" r="9"/.exec(await svg(request({ shape: id, hole })))![1]);
      const [from, to] = ends[id] ?? [4, 96];
      expect(await cy('top')).withContext(`${id} top`).toBeGreaterThan((480 * from) / 100 + 9 + 8);
      expect(await cy('bottom')).withContext(`${id} bottom`).toBeLessThan((480 * to) / 100 - 9 - 8);
    }
  });

  it('draws one bookmark per name, and the slices of a split picture', async () => {
    const names = await svg(request({ names: ['А', 'Б', 'В'] }));
    expect(names.match(/<clipPath/g)!.length).toBe(3);
    const split = await svg(request({ split: 4 }));
    expect(split.match(/<clipPath/g)!.length).toBe(4);
  });

  it('draws no strip of colour swatches over a picture', async () => {
    expect(await svg(request({ mode: 'picture', pattern: undefined, picture: await png() }))).not.toContain('stroke="#fff" stroke-width="2"/><rect');
    expect(await svg(request({ mode: 'picture', pattern: undefined, picture: await png() }))).not.toContain('rx="3"');
  });

  it('draws one bookmark for each of several pictures and moves a picture where it was positioned', async () => {
    const picture = await png();
    const four = await svg(request({ mode: 'picture', pattern: undefined, pictures: [picture, picture, picture, picture], framing: [] }));
    expect(four.match(/<clipPath/g)!.length).toBe(4);
    expect(four.match(/<image /g)!.length).toBe(4);

    const place = async (x: number) => /<image [^>]*? x="([-\d.]+)"/.exec(
      await svg(request({ mode: 'picture', pattern: undefined, picture, framing: [{ x, y: 0.5, zoom: 1 }] })))![1];
    expect(await place(0)).not.toBe(await place(1));
  });

  it('suggests four fixed colours and returns a small order file', async () => {
    expect((await engine.suggestColours(new Blob(['x']))).length).toBe(4);
    const order = await engine.createOrder(request(), { name: 'A', email: 'a@b.c', phone: '1', quantity: 1, notes: '', locale: 'bg' });
    expect(order.fileName).toBe('bookmark-order-stub-order.json');
    expect(order.bytes).toBeLessThan(1024);
  });
});
