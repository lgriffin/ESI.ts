import { runtimeOf } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When('the runtime shuts down', function () {
  runtimeOf(this).shutdown();
});
