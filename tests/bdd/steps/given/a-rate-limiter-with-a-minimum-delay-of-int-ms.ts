import { useLimiter } from '../../support/rate-limiter';
import { Given } from '../../support/steps';

Given(
  'a rate limiter with a minimum delay of {int} ms',
  function (minDelayMs: number) {
    useLimiter(this, { minDelayMs });
  },
);
