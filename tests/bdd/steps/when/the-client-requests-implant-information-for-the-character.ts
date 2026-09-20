import { CLONE_CHARACTER_ID } from '../../support/clones';
import { When } from '../../support/steps';

When(
  'the client requests implant information for the character',
  async function () {
    this.result = await this.client.clones.getImplants(CLONE_CHARACTER_ID);
  },
);
