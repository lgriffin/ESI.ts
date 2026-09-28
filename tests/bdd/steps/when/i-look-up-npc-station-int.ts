import { sdeProvider } from '../../support/sde';
import { When } from '../../support/steps';

When('I look up NPC station {int}', function (stationId: number) {
  this.result = sdeProvider(this).getNpcStation(stationId);
});
