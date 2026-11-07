import { breakerOf } from '../../support/circuit-breaker';
import { Given } from '../../support/steps';

Given('the endpoint {string} is checked', function (endpoint: string) {
  breakerOf(this).checkCircuit(endpoint);
});
