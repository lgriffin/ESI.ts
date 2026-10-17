import { runtimeOf } from '../../support/shared-runtime';
import { Then } from '../../support/steps';

Then(
  "the runtime's circuit breaker statistics shall report {int} open circuit with {int} failures",
  function (open: number, failures: number) {
    const stats = runtimeOf(this).getCircuitBreakerStats();
    expect(stats?.openCircuits).toBe(open);
    expect(Object.values(stats?.circuits ?? {})).toEqual([
      { state: 'open', failures },
    ]);
  },
);
