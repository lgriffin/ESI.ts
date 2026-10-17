import type { CircuitBreaker } from '../../../../src/core/circuitBreaker/CircuitBreaker';
import { suppliedOf } from '../../support/shared-runtime';
import { Then } from '../../support/steps';

Then(
  'the supplied circuit breaker shall report {int} open circuit',
  function (open: number) {
    expect(
      suppliedOf<CircuitBreaker>(this, 'circuitBreaker').getStats()
        .openCircuits,
    ).toBe(open);
  },
);
