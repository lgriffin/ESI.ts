import { compareIds, sortedById } from '../../../src/sde/providers/order';

describe('SDE table order', () => {
  describe('compareIds', () => {
    it('orders numbers numerically, not lexically', () => {
      expect(compareIds(9, 10)).toBeLessThan(0);
      expect(compareIds(10, 9)).toBeGreaterThan(0);
      expect(compareIds(7, 7)).toBe(0);
    });

    it('orders strings by code point', () => {
      expect(compareIds('a', 'b')).toBe(-1);
      expect(compareIds('b', 'a')).toBe(1);
      expect(compareIds('a', 'a')).toBe(0);
    });

    it('puts every number before every string', () => {
      expect(compareIds(1, 'a')).toBe(-1);
      expect(compareIds('a', 1)).toBe(1);
    });
  });

  describe('sortedById', () => {
    it('returns a new array ordered by ID ascending', () => {
      const items = [{ id: 3 }, { id: 1 }, { id: 2 }];
      const sorted = sortedById(items, (item) => item.id);
      expect(sorted.map((item) => item.id)).toEqual([1, 2, 3]);
      expect(items.map((item) => item.id)).toEqual([3, 1, 2]);
    });

    it('keeps numeric IDs ahead of string IDs', () => {
      const sorted = sortedById(
        [{ id: 'b' }, { id: 2 }, { id: 'a' }, { id: 1 }],
        (item) => item.id,
      );
      expect(sorted.map((item) => item.id)).toEqual([1, 2, 'a', 'b']);
    });
  });
});
