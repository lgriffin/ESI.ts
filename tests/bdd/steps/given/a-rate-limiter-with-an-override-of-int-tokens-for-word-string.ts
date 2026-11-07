import { useLimiter } from '../../support/rate-limiter';
import { Given } from '../../support/steps';

Given(
  'a rate limiter with an override of {int} tokens for {word} {string}',
  function (maxTokens: number, method: string, path: string) {
    useLimiter(this, {
      minDelayMs: 0,
      endpointOverrides: {
        [`${method}:${path}`]: { maxTokens, windowSizeMs: 60_000 },
      },
    });
  },
);
