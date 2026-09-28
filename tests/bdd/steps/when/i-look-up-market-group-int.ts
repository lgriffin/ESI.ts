import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When('I look up market group {int}', function (marketGroupId: number) {
  this.result = sdeProvider(this).getMarketGroup(marketGroupId);
});
