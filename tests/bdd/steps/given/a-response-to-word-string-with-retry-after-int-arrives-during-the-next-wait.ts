import { limiterClockOf, readResponse } from '../../support/rate-limiter';
import { Given } from '../../support/steps';

Given(
  'a response to {word} {string} with Retry-After {int} arrives during the next wait',
  function (method: string, path: string, seconds: number) {
    const clock = limiterClockOf(this);
    clock.afterEachWait = () => {
      clock.afterEachWait = undefined;
      readResponse(this, 200, method, path, `retry-after=${seconds}`);
    };
  },
);
