import { sdeProvider } from '../../support/sde';
import { When } from '../../support/steps';

When('I look up the star for system {int}', function (systemId: number) {
  this.result = sdeProvider(this).getStarBySystem(systemId);
});
