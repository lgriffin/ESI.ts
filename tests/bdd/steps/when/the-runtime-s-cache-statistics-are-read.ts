import { runtimeOf } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When("the runtime's cache statistics are read", function () {
  this.result = runtimeOf(this).getCacheStats();
});
