import { sdeProvider } from '../../support/sde';
import { When } from '../../support/steps';

When('I look up planets for system {int}', function (systemId: number) {
  this.result = sdeProvider(this).getPlanetsBySystem(systemId);
});
