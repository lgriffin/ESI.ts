import { useBreaker } from '../../support/circuit-breaker';
import { Given } from '../../support/steps';

Given(
  'a circuit breaker that opens after {int} failures and allows {int} probes',
  function (failureThreshold: number, halfOpenMaxAttempts: number) {
    useBreaker(this, {
      failureThreshold,
      resetTimeoutMs: 1000,
      halfOpenMaxAttempts,
    });
  },
);
