import {
  ALL_CATEGORIES,
  expectSearchRequest,
  searchFixtures,
  searchQueries,
} from '../../support/search';
import { Then } from '../../support/steps';

Then('I shall still receive valid results', function () {
  expectSearchRequest(searchQueries.short, ALL_CATEGORIES);
  expect(this.result).toEqual(searchFixtures.short());
});
