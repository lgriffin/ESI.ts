import { CITADEL_ID } from '../../support/universe';
import { When } from '../../support/steps';

When('the client requests structure information', async function () {
  this.result = await this.client.universe.getStructureById(CITADEL_ID);
});
