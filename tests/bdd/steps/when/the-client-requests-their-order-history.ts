import { TRADER_CHARACTER_ID } from '../../support/market';
import { When } from '../../support/steps';

When('the client requests their order history', async function () {
  this.result =
    await this.client.market.getCharacterOrderHistory(TRADER_CHARACTER_ID);
});
