import { cacheOf } from '../../support/cache-components';
import { When } from '../../support/steps';

When('the cache is shut down', function () {
  cacheOf(this).shutdown();
});
