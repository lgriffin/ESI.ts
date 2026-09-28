import { sdeProvider } from '../../support/sde';
import { When } from '../../support/steps';

When('I look up root market groups', function () {
  this.result = sdeProvider(this).getRootMarketGroups();
});
