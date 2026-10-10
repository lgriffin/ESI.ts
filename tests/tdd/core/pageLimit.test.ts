import {
  MAX_PAGES,
  boundedPageCount,
} from '../../../src/core/pagination/pageLimit';

describe('boundedPageCount (security model P8)', () => {
  it('caps a reported page count at MAX_PAGES', () => {
    expect(MAX_PAGES).toBe(1000);
    expect(boundedPageCount(100_000_000)).toBe(1000);
    expect(boundedPageCount(1001)).toBe(1000);
    expect(boundedPageCount(Number.POSITIVE_INFINITY)).toBe(1);
  });

  it('passes a count at or under the cap through', () => {
    expect(boundedPageCount(1000)).toBe(1000);
    expect(boundedPageCount(999)).toBe(999);
    expect(boundedPageCount(1)).toBe(1);
  });

  it('reads an unreadable, zero or negative count as one page', () => {
    expect(boundedPageCount(Number.NaN)).toBe(1);
    expect(boundedPageCount(0)).toBe(1);
    expect(boundedPageCount(-5)).toBe(1);
  });

  it('drops a fractional part', () => {
    expect(boundedPageCount(2.9)).toBe(2);
  });
});
