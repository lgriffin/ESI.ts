import { createSeamRuntime } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given(
  'a runtime for the application {string} with a circuit breaker that opens after {int} failures',
  function (userAgent: string, failures: number) {
    this.esi = createSeamRuntime({
      userAgent,
      enableCircuitBreaker: true,
      circuitBreakerConfig: { failureThreshold: failures },
    });
  },
);
