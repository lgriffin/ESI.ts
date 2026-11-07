import { useBreaker } from '../../support/circuit-breaker';
import { Given } from '../../support/steps';

Given(
  'a circuit breaker that opens after {int} failures and drops circuits idle for {int} ms',
  function (failureThreshold: number, staleThresholdMs: number) {
    useBreaker(this, {
      failureThreshold,
      resetTimeoutMs: 100_000,
      staleThresholdMs,
    });
  },
);
