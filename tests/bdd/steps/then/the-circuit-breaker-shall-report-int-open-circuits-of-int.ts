import { breakerOf } from '../../support/circuit-breaker';
import { Then } from '../../support/steps';

Then(
  'the circuit breaker shall report {int} open circuits of {int}',
  function (open: number, total: number) {
    const stats = breakerOf(this).getStats();
    expect(stats.openCircuits).toBe(open);
    expect(stats.totalCircuits).toBe(total);
  },
);
