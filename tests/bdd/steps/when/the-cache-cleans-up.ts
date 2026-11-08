import { etagCacheOf } from '../../support/cache-components';
import { When } from '../../support/steps';

When('the cache cleans up', function () {
  this.result = etagCacheOf(this).cleanup();
});
