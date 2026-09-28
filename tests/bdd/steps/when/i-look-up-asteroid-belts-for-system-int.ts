import { sdeProvider } from '../../support/sde';
import { When } from '../../support/steps';

When('I look up asteroid belts for system {int}', function (systemId: number) {
  this.result = sdeProvider(this).getAsteroidBeltsBySystem(systemId);
});
