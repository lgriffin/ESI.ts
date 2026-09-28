import { sdeProvider } from '../../support/sde';
import { When } from '../../support/steps';

When('I look up faction {int}', function (factionId: number) {
  this.result = sdeProvider(this).getFaction(factionId);
});
