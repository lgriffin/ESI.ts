import { buildCustomClient } from '../../support/custom-client';
import { Given } from '../../support/steps';

Given(
  'a custom client built with the {string} client and a circuit breaker that opens after {int} failures',
  function (name: string, failures: number) {
    buildCustomClient(this, [name], undefined, {
      enableCircuitBreaker: true,
      circuitBreakerConfig: { failureThreshold: failures },
    });
  },
);
