import { TRITANIUM } from '../../support/market';
import { Then } from '../../support/steps';

Then('the client shall return current buy and sell orders', function () {
  expect(this.result).toHaveLength(2);
  expect(this.result.map((o: any) => o.order_id)).toEqual([
    5000000001, 5000000002,
  ]);
  for (const order of this.result) {
    expect(order.type_id).toBe(TRITANIUM);
    expect(typeof order.price).toBe('number');
    expect(typeof order.is_buy_order).toBe('boolean');
  }
  expect(this.result.map((o: any) => o.is_buy_order)).toEqual([true, false]);
});
