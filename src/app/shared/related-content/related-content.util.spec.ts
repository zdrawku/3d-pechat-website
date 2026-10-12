import { BlogPost } from '../../models/blog-post.model';
import { Product } from '../../models/product.model';
import { pickRelatedPosts, pickRelatedProducts, stems } from './related-content.util';

function post(id: number, slug: string, title: string, tags: string[], date = '2026-06-01'): BlogPost {
  return { id: String(id), slug, title, description: '', route: `/blog/${slug}`, date: new Date(date), tags };
}

function product(id: number, name: string, tags: string[], dateAdded = '2026-03-01'): Product {
  return {
    id,
    linkId: `p-${id}`,
    name,
    description: '',
    frontImage: `/assets/real-images/${id}.webp`,
    dateAdded,
    hasOldCoins: false,
    hasEuroCoins: false,
    tags
  };
}

describe('related-content util', () => {
  describe('stems', () => {
    it('lines up Bulgarian inflections and drops generic words', () => {
      expect(stems('подарък').has('подар')).toBeTrue();
      expect(stems('подаръци').has('подар')).toBeTrue();
      expect(stems('3D принтиране').size).toBe(0);
    });
  });

  describe('pickRelatedPosts', () => {
    const lithophane = post(1, 'litofan', 'Литофан от снимка', ['литофан', 'подаръци', '3D принтиране']);
    const gifts = post(2, 'gifts', 'Идеи за подаръци', ['подаръци', 'идеи']);
    const infill = post(3, 'infill', 'Infill настройки', ['infill', 'здравина'], '2026-07-01');
    const newest = post(4, 'newest', 'Нещо съвсем друго', ['бизнес'], '2026-10-01');
    const all = [lithophane, gifts, infill, newest];

    it('never includes the current post', () => {
      expect(pickRelatedPosts(lithophane, all).map((p) => p.slug)).not.toContain('litofan');
    });

    it('puts the post sharing tags first', () => {
      expect(pickRelatedPosts(lithophane, all)[0].slug).toBe('gifts');
    });

    it('tops up with the newest posts when nothing overlaps', () => {
      const picked = pickRelatedPosts(infill, all, 2).map((p) => p.slug);
      expect(picked).toEqual(['newest', 'gifts']);
    });

    it('respects the limit and is deterministic', () => {
      expect(pickRelatedPosts(lithophane, all, 2).length).toBe(2);
      expect(pickRelatedPosts(lithophane, all)).toEqual(pickRelatedPosts(lithophane, all));
    });
  });

  describe('pickRelatedProducts', () => {
    const coin = (id: number) => product(id, `Вариант ${id}: монетна карта`, ['монетна карта', 'колекция'], '2026-02-01');
    const catalog = [
      coin(2), coin(4), coin(6),
      product(9, 'Стойка за слушалки', ['слушалки', 'гейминг'], '2026-03-02'),
      product(13, 'Органайзер за бижута', ['бижута', 'подарък'], '2026-03-04'),
      product(14, 'Разделители за книги', ['книга'], '2026-10-01')
    ];

    it('matches products to the post by tags and title words', () => {
      const lithophane = post(1, 'litofan', 'Литофан — подарък от снимка', ['литофан', 'подаръци']);
      expect(pickRelatedProducts(lithophane, catalog)[0].id).toBe(13);
    });

    it('shows one card per product family, not three coin-card variants', () => {
      const coins = post(5, 'coins', 'Колекция монетни карти', ['монетни карти', 'колекция']);
      const picked = pickRelatedProducts(coins, catalog);
      expect(picked.filter((p) => p.name.includes('монетна карта')).length).toBe(1);
      expect(picked.length).toBe(3);
    });

    it('falls back to the newest products when nothing matches', () => {
      const unrelated = post(6, 'infill', 'Infill настройки', ['infill']);
      expect(pickRelatedProducts(unrelated, catalog)[0].id).toBe(14);
    });

    it('skips products without an image', () => {
      const noImage = { ...product(99, 'Без снимка', ['подарък']), frontImage: undefined };
      const gift = post(7, 'gift', 'Подарък', ['подарък']);
      expect(pickRelatedProducts(gift, [noImage, ...catalog]).some((p) => p.id === 99)).toBeFalse();
    });
  });
});
