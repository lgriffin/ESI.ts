import { openHierarchicalProvider } from '../../support/sde';
import { Given } from '../../support/steps';

Given('an SDE provider with Tritanium loaded', function () {
  openHierarchicalProvider(this);
});
