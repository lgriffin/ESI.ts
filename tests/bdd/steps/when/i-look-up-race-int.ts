import { sdeProvider } from '../../support/sde';
import { When } from '../../support/steps';

When('I look up race {int}', function (raceId: number) {
  this.result = sdeProvider(this).getRace(raceId);
});
