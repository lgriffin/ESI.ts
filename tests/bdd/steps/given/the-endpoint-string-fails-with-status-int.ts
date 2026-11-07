import { breakerOf } from '../../support/circuit-breaker';
import { Given } from '../../support/steps';

Given(
  'the endpoint {string} fails with status {int}',
  function (endpoint: string, status: number) {
    breakerOf(this).recordFailure(endpoint, status);
  },
);
