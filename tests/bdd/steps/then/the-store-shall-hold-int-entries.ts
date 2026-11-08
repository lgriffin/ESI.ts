import { storeOf } from '../../support/cache-components';
import { Then } from '../../support/steps';

Then('the store shall hold {int} entries', function (count: number) {
  expect(storeOf(this).entries.size).toBe(count);
});
