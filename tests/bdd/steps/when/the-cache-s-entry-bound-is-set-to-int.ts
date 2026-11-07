import { etagCacheOf } from '../../support/cache-components';
import { When } from '../../support/steps';

When("the cache's entry bound is set to {int}", function (maxEntries: number) {
  etagCacheOf(this).updateConfig({ maxEntries });
});
