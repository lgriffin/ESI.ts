import { CircuitBreaker } from '../../../../src/core/circuitBreaker/CircuitBreaker';
import { buildCustomClient } from '../../support/custom-client';
import { Given } from '../../support/steps';

Given(
  'a custom client built with the {string} client and a supplied circuit breaker that opens after {int} failures',
  function (name: string, failures: number) {
    const circuitBreaker = new CircuitBreaker({ failureThreshold: failures });
    this.values.circuitBreaker = circuitBreaker;
    this.cleanups.push(() => circuitBreaker.shutdown());
    buildCustomClient(this, [name], undefined, { circuitBreaker });
  },
);
