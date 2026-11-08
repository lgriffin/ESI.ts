import { breakerOf } from '../../support/circuit-breaker';
import { When } from '../../support/steps';

When('the circuit breaker cleans up', function () {
  this.result = breakerOf(this).cleanup();
});
