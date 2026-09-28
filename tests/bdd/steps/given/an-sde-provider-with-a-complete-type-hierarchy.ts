import { openHierarchicalProvider } from '../../support/sde';
import { Given } from '../../support/steps';

Given('an SDE provider with a complete type hierarchy', function () {
  openHierarchicalProvider(this);
});
