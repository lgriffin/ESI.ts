import { LARGE_INDEX_SIZE, universeFixtures } from '../../support/universe';
import { Then } from '../../support/steps';

Then('the client shall handle it efficiently', function () {
  expect(this.result).toHaveLength(LARGE_INDEX_SIZE);
  expect(this.result).toEqual(universeFixtures.largeSystemIndex());
  expect(this.values.elapsedMs).toBeLessThan(1000);
});
