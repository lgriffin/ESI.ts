import { cacheOf } from '../../support/cache-components';
import { Then } from '../../support/steps';

Then('the cache shall hold {string}', function (url: string) {
  expect(cacheOf(this).has(url)).toBe(true);
});
