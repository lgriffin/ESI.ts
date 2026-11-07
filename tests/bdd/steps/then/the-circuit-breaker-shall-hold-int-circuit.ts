import { apiClientOf } from '../../support/pipeline-parts';
import { Then } from '../../support/steps';

Then('the circuit breaker shall hold {int} circuit', function (count: number) {
  expect(apiClientOf(this).getCircuitBreaker()?.getStats().totalCircuits).toBe(
    count,
  );
});
