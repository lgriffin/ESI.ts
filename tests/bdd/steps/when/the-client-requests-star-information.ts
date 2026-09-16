import { JITA_STAR_ID } from '../../support/universe';
import { When } from '../../support/steps';

When('the client requests star information', async function () {
  this.result = await this.client.universe.getStarById(JITA_STAR_ID);
});
