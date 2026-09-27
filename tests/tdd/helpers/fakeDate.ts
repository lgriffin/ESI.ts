/**
 * Freeze Date at `now` on Jest's fake clock while every timer stays real.
 *
 * For tests that drive the whole request pipeline, whose fetch timeout and
 * promise plumbing should run as normal, but whose assertions depend on what
 * Date.now() returns (a cache entry's age, a response's duration). Move the
 * clock with jest.setSystemTime(); restore with jest.useRealTimers().
 */
export function useFakeDate(now: number): void {
  jest.useFakeTimers({
    now,
    doNotFake: [
      'hrtime',
      'nextTick',
      'performance',
      'queueMicrotask',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'requestIdleCallback',
      'cancelIdleCallback',
      'setImmediate',
      'clearImmediate',
      'setInterval',
      'clearInterval',
      'setTimeout',
      'clearTimeout',
    ],
  });
}
