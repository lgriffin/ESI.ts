import {
  ALL_CATEGORIES,
  expectSearchRequest,
  searchFixtures,
  searchQueries,
} from '../../support/search';
import { Then } from '../../support/steps';

Then('the client shall return undefined or empty category arrays', function () {
  expectSearchRequest(searchQueries.nothing, ALL_CATEGORIES);
  expect(this.result).toEqual(searchFixtures.nothing());
  for (const category of ALL_CATEGORIES) {
    expect(this.result).not.toHaveProperty(category);
  }
});
