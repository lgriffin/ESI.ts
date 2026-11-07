import { ordersOfPages } from '../../support/paging';
import { Then } from '../../support/steps';

Then(
  'the walk shall resolve with the orders of pages {int} to {int}',
  function (from: number, to: number) {
    expect(this.error).toBeUndefined();
    expect(this.result).toEqual(ordersOfPages(this, from, to));
  },
);
