import { useBreaker } from '../../support/circuit-breaker';
import { Given } from '../../support/steps';

Given(
  'a circuit breaker that drops circuits idle for {int} ms and cleans up every {int} ms',
  function (staleThresholdMs: number, cleanupIntervalMs: number) {
    useBreaker(this, { staleThresholdMs, cleanupIntervalMs });
  },
);
