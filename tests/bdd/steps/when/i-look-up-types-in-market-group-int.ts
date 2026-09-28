import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When('I look up types in market group {int}', function (marketGroupId: number) {
  this.result = sdeProvider(this).getTypesByMarketGroup(marketGroupId);
});
