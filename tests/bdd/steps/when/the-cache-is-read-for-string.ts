import { cacheOf } from '../../support/cache-components';
import { When } from '../../support/steps';

When('the cache is read for {string}', function (url: string) {
  this.result = cacheOf(this).get(url);
});
