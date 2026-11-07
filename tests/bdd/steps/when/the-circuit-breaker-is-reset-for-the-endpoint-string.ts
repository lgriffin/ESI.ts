import { breakerOf } from '../../support/circuit-breaker';
import { When } from '../../support/steps';

When(
  'the circuit breaker is reset for the endpoint {string}',
  function (endpoint: string) {
    breakerOf(this).reset(endpoint);
  },
);
