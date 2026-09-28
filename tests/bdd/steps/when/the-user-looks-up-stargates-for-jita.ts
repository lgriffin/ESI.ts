import { JITA, sdeProvider } from '../../support/sde';
import { When } from '../../support/steps';

When('the user looks up stargates for Jita', function () {
  this.result = sdeProvider(this).getStargatesBySystem(JITA.solarSystemId);
});
