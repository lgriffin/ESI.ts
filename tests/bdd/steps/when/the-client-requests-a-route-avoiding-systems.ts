import { AMARR, AVOIDED_SYSTEM_IDS, JITA } from '../../support/route';
import { When } from '../../support/steps';

When('the client requests a route avoiding systems', async function () {
  this.result = await this.client.route.getRoute(JITA, AMARR, {
    avoid_systems: AVOIDED_SYSTEM_IDS,
  });
});
