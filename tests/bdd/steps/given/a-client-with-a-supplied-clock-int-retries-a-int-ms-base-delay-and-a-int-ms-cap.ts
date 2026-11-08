import { ManualClock } from '../../support/shared-runtime';
import { createSeamClient } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'a client with a supplied clock, {int} retries, a {int} ms base delay and a {int} ms cap',
  function (maxRetries: number, baseDelayMs: number, maxDelayMs: number) {
    const clock = new ManualClock();
    this.values.clock = clock;
    this.client = createSeamClient({
      clock,
      retryConfig: { maxRetries, baseDelayMs, maxDelayMs },
    });
  },
);
