import { queueOrderPages } from '../../support/paging';
import { Given } from '../../support/steps';

Given(
  'ESI answers the market orders with {int} page of {int} orders reporting {string} pages',
  function (pages: number, orders: number, reported: string) {
    queueOrderPages(this, Array<number>(pages).fill(orders), reported);
  },
);
