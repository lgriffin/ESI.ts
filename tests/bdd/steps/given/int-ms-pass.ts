import { breakerClock } from '../../support/circuit-breaker';
import { Given } from '../../support/steps';

Given('{int} ms pass', function (ms: number) {
  breakerClock(this).advance(ms);
});
