import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When('I look up stargate {int}', function (stargateId: number) {
  this.result = sdeProvider(this).getStargate(stargateId);
});
