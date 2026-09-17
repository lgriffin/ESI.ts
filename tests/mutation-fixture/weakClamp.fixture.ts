import { clamp } from './weakClamp';

// Deliberately weak: only the in-range path is asserted, so mutants of the
// bound checks survive. See weakClamp.ts.
describe('clamp (known-weak mutation fixture)', () => {
  it('returns a value that is already in range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
});
