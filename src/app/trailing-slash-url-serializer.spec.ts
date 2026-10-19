import { TrailingSlashUrlSerializer } from './trailing-slash-url-serializer';

describe('TrailingSlashUrlSerializer', () => {
  const serializer = new TrailingSlashUrlSerializer();
  const segments = (url: string) =>
    (serializer.parse(url).root.children['primary']?.segments ?? []).map((s) => s.path);

  it('serializes every path with a trailing slash, before the ?query and #fragment', () => {
    expect(serializer.serialize(serializer.parse('/en/prices'))).toBe('/en/prices/');
    expect(serializer.serialize(serializer.parse('/products#variant-1'))).toBe('/products/#variant-1');
    expect(serializer.serialize(serializer.parse('/'))).toBe('/');
  });

  it('parses a trailing slash away, so its own output reads back as the same route', () => {
    expect(segments('/en/prices/')).toEqual(['en', 'prices']);
    expect(segments('/blog/what-is-3d-printing/')).toEqual(['blog', 'what-is-3d-printing']);
    expect(segments('/')).toEqual([]);
    for (const url of ['/en/prices/', '/products/#variant-1', '/blog/x/?a=1', '/']) {
      expect(serializer.serialize(serializer.parse(url))).withContext(url).toBe(url);
    }
  });
});
