import { MINERAL_GROUP_ID } from '../../support/universe';
import { When } from '../../support/steps';

When('the client requests group information', async function () {
  this.result = await this.client.universe.getItemGroupById(MINERAL_GROUP_ID);
});
