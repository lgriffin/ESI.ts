import { JITA } from '../../support/route';
import { When } from '../../support/steps';

When('the client requests a route to itself', async function () {
  this.result = await this.client.route.getRoute(JITA, JITA);
});
