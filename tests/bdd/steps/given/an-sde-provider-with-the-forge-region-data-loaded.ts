import { openHierarchicalProvider } from '../../support/sde';
import { Given } from '../../support/steps';

Given('an SDE provider with The Forge region data loaded', function () {
  openHierarchicalProvider(this);
});
