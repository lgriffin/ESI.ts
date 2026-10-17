import { CircuitBreaker } from '../../../../src/core/circuitBreaker/CircuitBreaker';
import { createSeamRuntime } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given(
  'a runtime for the application {string} with a supplied circuit breaker that opens after {int} failures',
  function (userAgent: string, failures: number) {
    const circuitBreaker = new CircuitBreaker({ failureThreshold: failures });
    this.values.circuitBreaker = circuitBreaker;
    this.esi = createSeamRuntime({ userAgent, circuitBreaker });
  },
);
