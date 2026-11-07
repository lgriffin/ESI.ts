import { cacheOf } from '../../support/cache-components';
import { When } from '../../support/steps';

When('the cache deletes {string}', function (url: string) {
  cacheOf(this).delete(url);
});
