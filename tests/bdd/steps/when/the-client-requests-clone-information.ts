import { CLONE_CHARACTER_ID } from '../../support/clones';
import { When } from '../../support/steps';

When('the client requests clone information', async function () {
  this.result = await this.client.clones.getClones(CLONE_CHARACTER_ID);
});
