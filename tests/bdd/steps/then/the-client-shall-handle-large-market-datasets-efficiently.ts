import { LARGE_ORDER_BOOK_SIZE } from '../../support/market';
import { Then } from '../../support/steps';

Then('the client shall handle large market datasets efficiently', function () {
  expect(this.result).toHaveLength(LARGE_ORDER_BOOK_SIZE);
  expect(this.result[0].order_id).toBe(5000000001);
  expect(this.result[LARGE_ORDER_BOOK_SIZE - 1].order_id).toBe(5000005000);
  expect(this.values.elapsedMs).toBeLessThan(1000);
});
