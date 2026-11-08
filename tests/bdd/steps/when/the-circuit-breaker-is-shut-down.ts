import { breakerOf } from '../../support/circuit-breaker';
import { When } from '../../support/steps';

When('the circuit breaker is shut down', function () {
  breakerOf(this).shutdown();
});
