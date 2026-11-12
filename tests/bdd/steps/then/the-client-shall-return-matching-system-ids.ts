import {
  ALL_CATEGORIES,
  expectSearchRequest,
  searchFixtures,
  searchQueries,
} from '../../support/search';
import { Then } from '../../support/steps';

Then('the client shall return matching system IDs', function () {
  expectSearchRequest(searchQueries.solarSystem, ALL_CATEGORIES);
  expect(this.result).toEqual(searchFixtures.solarSystems());
});
