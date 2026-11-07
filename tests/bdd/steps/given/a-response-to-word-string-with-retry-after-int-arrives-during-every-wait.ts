import { limiterClockOf, readResponse } from '../../support/rate-limiter';
import { Given } from '../../support/steps';

Given(
  'a response to {word} {string} with Retry-After {int} arrives during every wait',
  function (method: string, path: string, seconds: number) {
    limiterClockOf(this).afterEachWait = () => {
      readResponse(this, 200, method, path, `retry-after=${seconds}`);
    };
  },
);
