import { surfaceOf } from '../../support/client-construction';
import { Then } from '../../support/steps';

Then(
  "the client's circuit breaker shall hold {int} circuits",
  function (count: number) {
    expect(
      surfaceOf(this).apiClient().getCircuitBreaker()?.getStats().totalCircuits,
    ).toBe(count);
  },
);
