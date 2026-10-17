import {
  CountingRateLimiter,
  createSeamRuntime,
} from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given(
  'a runtime for the application {string} with a supplied rate limiter',
  function (userAgent: string) {
    const rateLimiter = new CountingRateLimiter();
    this.values.rateLimiter = rateLimiter;
    this.esi = createSeamRuntime({ userAgent, rateLimiter });
  },
);
