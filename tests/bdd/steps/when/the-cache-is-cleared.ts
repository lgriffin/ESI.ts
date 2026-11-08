import { cacheOf } from '../../support/cache-components';
import { When } from '../../support/steps';

When('the cache is cleared', function () {
  cacheOf(this).clear();
});
