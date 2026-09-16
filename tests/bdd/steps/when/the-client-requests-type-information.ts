import { TRITANIUM_TYPE_ID } from '../../support/universe';
import { When } from '../../support/steps';

When('the client requests type information', async function () {
  this.result = await this.client.universe.getTypeById(TRITANIUM_TYPE_ID);
});
