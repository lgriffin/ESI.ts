import { pagedOrder } from '../../support/paging';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI answers the market orders with {int} pages, page {int} holding an order whose id is not a number',
  function (pages: number, bad: number) {
    for (let page = 1; page <= pages; page++) {
      const order =
        page === bad
          ? { ...pagedOrder(page, 0), order_id: 'seven' }
          : pagedOrder(page, 0);
      queueResponse({
        match:
          page === 1
            ? /orders\/\?order_type=all$/
            : new RegExp(`[?&]page=${page}$`),
        headers: { 'x-pages': String(pages) },
        body: [order],
      });
    }
  },
);
