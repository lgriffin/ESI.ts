import { rateLimiterOf } from '../../support/rate-limiter';
import { Then } from '../../support/steps';

Then(
  'the limiter status shall report {int} errors left and a reset in {int} seconds',
  function (remain: number, reset: number) {
    const status = rateLimiterOf(this).getStatus();
    expect([status.errorLimitRemain, status.errorLimitReset]).toEqual([
      remain,
      reset,
    ]);
  },
);
