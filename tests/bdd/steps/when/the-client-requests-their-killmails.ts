import { QUIET_CHARACTER_ID } from '../../support/killmails';
import { When } from '../../support/steps';

When('the client requests their killmails', async function () {
  this.result =
    await this.client.killmails.getCharacterRecentKillmails(QUIET_CHARACTER_ID);
});
