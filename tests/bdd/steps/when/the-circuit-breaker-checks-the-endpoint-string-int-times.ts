import { breakerOf } from '../../support/circuit-breaker';
import { When } from '../../support/steps';

When(
  'the circuit breaker checks the endpoint {string} {int} times',
  function (endpoint: string, times: number) {
    let admitted = 0;
    for (let i = 0; i < times; i++) {
      try {
        breakerOf(this).checkCircuit(endpoint);
        admitted++;
      } catch (error) {
        this.error = error;
        break;
      }
    }
    this.result = admitted;
  },
);
