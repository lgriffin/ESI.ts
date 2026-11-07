import { apiClientOf } from '../../support/pipeline-parts';
import { Then } from '../../support/steps';

Then("the pipeline's circuit breaker shall hold no circuits", function () {
  expect(apiClientOf(this).getCircuitBreaker()?.getStats().totalCircuits).toBe(
    0,
  );
});
