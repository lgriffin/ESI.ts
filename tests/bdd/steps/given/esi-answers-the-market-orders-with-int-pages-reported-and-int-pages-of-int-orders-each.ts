import { queueOrderPages } from '../../support/paging';
import { Given } from '../../support/steps';

Given(
  'ESI answers the market orders with {int} pages reported and {int} pages of {int} orders each',
  function (reported: number, pages: number, orders: number) {
    queueOrderPages(this, Array<number>(pages).fill(orders), String(reported));
  },
);
