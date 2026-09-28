import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When('I close the provider', function () {
  sdeProvider(this).close();
});
