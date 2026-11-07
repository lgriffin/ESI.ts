import { cacheOf } from '../../support/cache-components';
import { When } from '../../support/steps';

When(
  'the cache is read for {string} {int} times',
  function (url: string, times: number) {
    for (let i = 0; i < times; i += 1) this.result = cacheOf(this).get(url);
  },
);
