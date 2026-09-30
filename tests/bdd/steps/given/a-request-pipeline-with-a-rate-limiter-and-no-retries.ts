import { pipelineWithRateLimiter } from '../../support/rate-limit';
import { Given } from '../../support/steps';

Given('a request pipeline with a rate limiter and no retries', function () {
  pipelineWithRateLimiter(this);
});
