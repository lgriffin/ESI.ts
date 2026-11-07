import { queueOrderPages } from '../../support/paging';
import { Given } from '../../support/steps';

Given(
  'ESI answers the market orders with {int} pages, page {int} empty',
  function (pages: number, empty: number) {
    const sizes = Array.from({ length: pages }, (_, i) =>
      i + 1 === empty ? 0 : 2,
    );
    queueOrderPages(this, sizes.slice(0, empty), String(pages));
  },
);
