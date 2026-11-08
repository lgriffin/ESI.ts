import type { ManualClock } from '../../support/shared-runtime';
import { Then } from '../../support/steps';

Then(
  'the client shall have waited between {int} and {int} ms and then {int} ms',
  function (low: number, high: number, then: number) {
    expect(this.error).toBeUndefined();
    const waits = (this.values.clock as ManualClock).waits.filter(
      (ms) => ms > 0,
    );
    expect(waits).toHaveLength(2);
    expect(waits[0]).toBeGreaterThanOrEqual(low);
    expect(waits[0]).toBeLessThanOrEqual(high);
    expect(waits[1]).toBe(then);
  },
);
