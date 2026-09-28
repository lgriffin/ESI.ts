import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When('I look up planet {int}', function (planetId: number) {
  this.result = sdeProvider(this).getPlanet(planetId);
});
