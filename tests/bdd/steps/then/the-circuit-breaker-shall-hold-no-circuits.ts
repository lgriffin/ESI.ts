import { breakerOf } from '../../support/circuit-breaker';
import { Then } from '../../support/steps';

Then('the circuit breaker shall hold no circuits', function () {
  expect(breakerOf(this).getStats().circuits).toEqual({});
});
