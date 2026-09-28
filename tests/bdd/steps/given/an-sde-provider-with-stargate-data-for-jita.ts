import { openHierarchicalProvider } from '../../support/sde';
import { Given } from '../../support/steps';

Given('an SDE provider with stargate data for Jita', function () {
  openHierarchicalProvider(this);
});
