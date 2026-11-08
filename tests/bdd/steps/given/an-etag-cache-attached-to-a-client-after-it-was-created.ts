import { etagCacheOf, useEtagCache } from '../../support/cache-components';
import { Given } from '../../support/steps';

Given('an ETag cache attached to a client after it was created', function () {
  useEtagCache(this, { attachLater: true });
  etagCacheOf(this).setClient(this.values.cacheClient);
});
