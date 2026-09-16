import { CLONE_CHARACTER_ID } from '../../support/clones';
import { When } from '../../support/steps';

When('the client retrieves clone info and implants', async function () {
  const clones = await this.client.clones.getClones(CLONE_CHARACTER_ID);
  const implants = await this.client.clones.getImplants(CLONE_CHARACTER_ID);
  this.result = { clones, implants };
});
