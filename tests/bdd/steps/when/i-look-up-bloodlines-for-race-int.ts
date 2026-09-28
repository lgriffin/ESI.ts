import { sdeProvider } from '../../support/sde';
import { When } from '../../support/steps';

When('I look up bloodlines for race {int}', function (raceId: number) {
  this.result = sdeProvider(this).getBloodlinesByRace(raceId);
});
