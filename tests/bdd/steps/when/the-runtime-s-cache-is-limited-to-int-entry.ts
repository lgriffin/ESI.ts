import { runtimeOf } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  "the runtime's cache is limited to {int} entry",
  function (maxEntries: number) {
    runtimeOf(this).updateCacheConfig({ maxEntries });
  },
);
