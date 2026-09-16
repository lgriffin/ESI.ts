import { THE_FORGE, TRITANIUM } from '../../support/market';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return their active orders', function () {
  expect(lastRequest().headers.authorization).toBe('Bearer bdd-access-token');
  expect(this.result).toHaveLength(1);
  expect(this.result[0]).toMatchObject({
    order_id: 5000000001,
    type_id: TRITANIUM,
    price: 4.5,
    region_id: THE_FORGE,
    is_corporation: true,
  });
});
