import { localizeGallery } from './localized-content';

describe('localizeGallery', () => {
  const images = [
    { src: '/a.webp', alt: 'Монетник' },
    { src: '/b.webp', alt: 'Лампа' },
    { src: '/c.webp', alt: '' }
  ];

  it('uses the translated alt text, keyed by src', () => {
    expect(localizeGallery(images, { '/a.webp': 'Coin holder' }, 'bg')[0]).toEqual({ src: '/a.webp', alt: 'Coin holder', lang: null });
  });

  it('keeps an untranslated Bulgarian alt, marked with its language', () => {
    expect(localizeGallery(images, {}, 'bg')[1]).toEqual({ src: '/b.webp', alt: 'Лампа', lang: 'bg' });
  });

  it('marks nothing on Bulgarian pages, or where the template supplies the fallback', () => {
    expect(localizeGallery(images, {}, null).map(i => i.lang)).toEqual([null, null, null]);
    expect(localizeGallery(images, {}, 'bg')[2]).toEqual({ src: '/c.webp', alt: '', lang: null });
  });
});
