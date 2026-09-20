import { ENTITY_IDS } from '../../support/universe';
import { When } from '../../support/steps';

When('the client requests name resolution', async function () {
  this.result = await this.client.universe.postNamesAndCategories(ENTITY_IDS);
});
