import { customClientOf } from '../../support/custom-client';
import { When } from '../../support/steps';

When("the custom client's circuit breaker is reset", function () {
  customClientOf(this).resetCircuitBreaker();
});
