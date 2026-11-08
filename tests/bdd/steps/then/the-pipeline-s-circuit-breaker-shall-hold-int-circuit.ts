import { apiClientOf } from '../../support/pipeline-parts';
import { Then } from '../../support/steps';

Then(
  "the pipeline's circuit breaker shall hold {int} circuit",
  function (count: number) {
    expect(
      apiClientOf(this).getCircuitBreaker()?.getStats().totalCircuits,
    ).toBe(count);
  },
);
