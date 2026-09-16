import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return price data for all tradeable items', function () {
  expect(lastRequest().method).toBe('GET');
  expect(this.result).toEqual([
    { type_id: 34, average_price: 5000000.0, adjusted_price: 5100000.0 },
    { type_id: 35, average_price: 15000000.0, adjusted_price: 15200000.0 },
  ]);
});
