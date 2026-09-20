import { AMARR, JITA } from '../../support/route';
import { When } from '../../support/steps';

When('the client requests a secure route', async function () {
  this.result = await this.client.route.getRoute(JITA, AMARR, {
    preference: 'Safer',
  });
});
