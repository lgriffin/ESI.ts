import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When('I look up solar system {int}', function (systemId: number) {
  this.result = sdeProvider(this).getSolarSystem(systemId);
});
