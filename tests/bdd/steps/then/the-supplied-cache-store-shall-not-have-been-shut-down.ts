import { type MapCacheStore, suppliedOf } from '../../support/shared-runtime';
import { Then } from '../../support/steps';

Then('the supplied cache store shall not have been shut down', function () {
  expect(suppliedOf<MapCacheStore>(this, 'cacheStore').shutdowns).toBe(0);
});
