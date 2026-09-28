import { openHierarchicalProvider } from '../../support/sde';
import { Given } from '../../support/steps';

Given('a static data provider with hierarchical test data', function () {
  openHierarchicalProvider(this);
});
