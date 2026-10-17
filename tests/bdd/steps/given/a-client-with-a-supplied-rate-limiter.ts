import { CountingRateLimiter } from '../../support/shared-runtime';
import { createSeamClient } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a client with a supplied rate limiter', function () {
  const rateLimiter = new CountingRateLimiter();
  this.values.rateLimiter = rateLimiter;
  this.client = createSeamClient({ rateLimiter });
});
