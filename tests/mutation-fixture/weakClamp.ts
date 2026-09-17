/**
 * Known-weak mutation fixture. Do not strengthen weakClamp.fixture.ts.
 *
 * npm run mutation:fixture mutates this file with only its fixture test, then
 * asserts that some mutants are killed (the test does check the in-range
 * result) and some survive (it never checks either bound). The pull request
 * mutation job runs it first: if Stryker, the report or the ratchet stop
 * noticing a weak test here, a green result on real code means nothing.
 */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}
