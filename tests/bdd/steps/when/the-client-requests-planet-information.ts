import { JITA_IV_ID } from '../../support/universe';
import { When } from '../../support/steps';

When('the client requests planet information', async function () {
  this.result = await this.client.universe.getPlanetById(JITA_IV_ID);
});
