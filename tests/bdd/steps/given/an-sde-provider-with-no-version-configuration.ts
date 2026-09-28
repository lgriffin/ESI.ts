import { openEmptyProvider } from '../../support/sde';
import { Given } from '../../support/steps';

Given('an SDE provider with no version configuration', function () {
  openEmptyProvider(this);
});
