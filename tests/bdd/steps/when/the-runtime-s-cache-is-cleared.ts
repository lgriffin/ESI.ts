import { runtimeOf } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When("the runtime's cache is cleared", function () {
  runtimeOf(this).clearCache();
});
