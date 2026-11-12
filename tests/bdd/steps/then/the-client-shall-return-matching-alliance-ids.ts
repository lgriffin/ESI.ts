import {
  ALL_CATEGORIES,
  expectSearchRequest,
  searchFixtures,
  searchQueries,
} from '../../support/search';
import { Then } from '../../support/steps';

Then('the client shall return matching alliance IDs', function () {
  expectSearchRequest(searchQueries.alliance, ALL_CATEGORIES);
  expect(this.result).toEqual(searchFixtures.alliances());
});
