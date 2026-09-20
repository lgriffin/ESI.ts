import { PILOT_CHARACTER_ID } from '../../support/killmails';
import { When } from '../../support/steps';

When('the client requests their recent killmails', async function () {
  this.result =
    await this.client.killmails.getCharacterRecentKillmails(PILOT_CHARACTER_ID);
});
