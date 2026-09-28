import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When('I look up constellation {int}', function (constellationId: number) {
  this.result = sdeProvider(this).getConstellation(constellationId);
});
