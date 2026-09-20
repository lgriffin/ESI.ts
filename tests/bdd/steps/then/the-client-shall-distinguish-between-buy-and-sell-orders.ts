import { Then } from '../../support/steps';

Then('the client shall distinguish between buy and sell orders', function () {
  expect(this.values.buyOrders.map((o: any) => o.order_id)).toEqual([1, 3]);
  expect(this.values.sellOrders.map((o: any) => o.order_id)).toEqual([2, 4]);
});
