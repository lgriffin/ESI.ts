import { runtimeOf } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When("the runtime's circuit breaker is reset", function () {
  runtimeOf(this).resetCircuitBreaker();
});
