import { Then } from '../../support/steps';

Then(
  'the walk shall resolve with {int} orders, the second with the order id {string}',
  function (count: number, id: string) {
    expect(this.error).toBeUndefined();
    const orders = this.result as { order_id: unknown }[];
    expect(orders).toHaveLength(count);
    expect(orders[1]!.order_id).toBe(id);
  },
);
