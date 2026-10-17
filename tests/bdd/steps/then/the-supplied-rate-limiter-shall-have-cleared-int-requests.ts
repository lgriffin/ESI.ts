import {
  type CountingRateLimiter,
  suppliedOf,
} from '../../support/shared-runtime';
import { Then } from '../../support/steps';

Then(
  'the supplied rate limiter shall have cleared {int} requests',
  function (count: number) {
    expect(suppliedOf<CountingRateLimiter>(this, 'rateLimiter').cleared).toBe(
      count,
    );
  },
);
