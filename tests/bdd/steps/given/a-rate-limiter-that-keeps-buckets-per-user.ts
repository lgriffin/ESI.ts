import { useLimiter, USER_HEADER } from '../../support/rate-limiter';
import { Given } from '../../support/steps';

Given('a rate limiter that keeps buckets per user', function () {
  useLimiter(this, {
    minDelayMs: 0,
    userKeyExtractor: (headers) => headers[USER_HEADER] ?? '',
  });
});
