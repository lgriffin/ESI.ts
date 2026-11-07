import { breakerOf } from '../../support/circuit-breaker';
import { Given } from '../../support/steps';

Given('the endpoint {string} succeeds', function (endpoint: string) {
  breakerOf(this).checkCircuit(endpoint);
  breakerOf(this).recordSuccess(endpoint);
});
