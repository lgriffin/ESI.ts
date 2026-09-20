import { PILOT_CHARACTER_ID } from '../../support/killmails';
import { When } from '../../support/steps';

When('the client requests character killmails without auth', async function () {
  try {
    await this.client.killmails.getCharacterRecentKillmails(PILOT_CHARACTER_ID);
  } catch (error) {
    this.error = error;
  }
});
