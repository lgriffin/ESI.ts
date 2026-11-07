import { runtimeOf } from '../../support/shared-runtime';
import { Then } from '../../support/steps';

Then(
  "the runtime's circuit breaker statistics shall report no circuits",
  function () {
    const stats = runtimeOf(this).getCircuitBreakerStats();
    expect(stats?.openCircuits).toBe(0);
    expect(stats?.circuits).toEqual({});
  },
);
