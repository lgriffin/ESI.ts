import { DISTANT_SYSTEM_ID, JITA } from '../../support/route';
import { When } from '../../support/steps';

When('the client requests a route between distant systems', async function () {
  this.result = await this.client.route.getRoute(JITA, DISTANT_SYSTEM_ID);
});
