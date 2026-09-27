import { runtimeOf } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When('the runtime is shut down twice', function () {
  const esi = runtimeOf(this);
  esi.shutdown();
  esi.shutdown();
});
