import { breakerOf } from '../../support/circuit-breaker';
import { When } from '../../support/steps';

When(
  'the circuit breaker checks the endpoint {string}',
  function (endpoint: string) {
    try {
      breakerOf(this).checkCircuit(endpoint);
      this.result = 'admitted';
    } catch (error) {
      this.error = error;
    }
  },
);
