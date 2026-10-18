import { buildSeamEsiClient } from '../../support/identity-views';
import { Given } from '../../support/steps';

Given(
  'an EsiClient that holds no token with a circuit breaker that opens after {int} failures',
  function (failures: number) {
    buildSeamEsiClient(this, {
      enableCircuitBreaker: true,
      circuitBreakerConfig: { failureThreshold: failures },
    });
  },
);
