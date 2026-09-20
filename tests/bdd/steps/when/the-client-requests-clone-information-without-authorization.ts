import { CLONE_CHARACTER_ID } from '../../support/clones';
import { When } from '../../support/steps';

When(
  'the client requests clone information without authorization',
  async function () {
    try {
      await this.client.clones.getClones(CLONE_CHARACTER_ID);
    } catch (e) {
      this.error = e;
    }
  },
);
