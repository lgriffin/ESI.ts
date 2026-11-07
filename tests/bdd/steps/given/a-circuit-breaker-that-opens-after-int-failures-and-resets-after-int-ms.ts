import { useBreaker } from '../../support/circuit-breaker';
import { Given } from '../../support/steps';

Given(
  'a circuit breaker that opens after {int} failures and resets after {int} ms',
  function (failureThreshold: number, resetTimeoutMs: number) {
    useBreaker(this, { failureThreshold, resetTimeoutMs });
  },
);
