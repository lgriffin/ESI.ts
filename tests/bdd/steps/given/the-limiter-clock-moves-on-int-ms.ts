import { limiterClockOf } from '../../support/rate-limiter';
import { Given } from '../../support/steps';

Given('the limiter clock moves on {int} ms', function (ms: number) {
  limiterClockOf(this).advance(ms);
});
