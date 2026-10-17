import { customClientOf } from '../../support/custom-client';
import { When } from '../../support/steps';

When('the custom client is shut down twice', function () {
  const custom = customClientOf(this);
  custom.shutdown();
  custom.shutdown();
});
