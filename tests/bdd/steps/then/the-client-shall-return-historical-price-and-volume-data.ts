import { TRITANIUM } from '../../support/market';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return historical price and volume data', function () {
  expect(lastRequest().url.searchParams.get('type_id')).toBe(String(TRITANIUM));
  expect(this.result).toEqual(this.values.expectedHistory);
});
