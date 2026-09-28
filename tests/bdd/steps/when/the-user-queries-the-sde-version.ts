import { sdeProvider } from '../../support/sde';
import { When } from '../../support/steps';

When('the user queries the SDE version', function () {
  this.result = sdeProvider(this).getVersion();
});
