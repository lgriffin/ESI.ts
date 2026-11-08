import { cacheClockOf } from '../../support/cache-components';
import { Given } from '../../support/steps';

Given('{int} ms pass on the cache clock', function (ms: number) {
  cacheClockOf(this).advance(ms);
});
