import { TRADER_CHARACTER_ID } from '../../support/market';
import { When } from '../../support/steps';

When('the client requests their market orders', async function () {
  this.result =
    await this.client.market.getCharacterOrders(TRADER_CHARACTER_ID);
});
