import { queueOrderPages } from '../../support/paging';
import { Given } from '../../support/steps';

Given(
  'ESI answers the market orders with {int} pages, pages {int} and {int} empty',
  function (pages: number, first: number, second: number) {
    const sizes = Array.from({ length: pages }, (_, i) =>
      i + 1 === first || i + 1 === second ? 0 : 2,
    );
    queueOrderPages(this, sizes);
  },
);
