import { breakerOf } from '../../support/circuit-breaker';
import { Given } from '../../support/steps';

Given(
  'the endpoint {string} fails {int} times with status {int}',
  function (endpoint: string, times: number, status: number) {
    for (let i = 0; i < times; i++) {
      breakerOf(this).recordFailure(endpoint, status);
    }
  },
);
