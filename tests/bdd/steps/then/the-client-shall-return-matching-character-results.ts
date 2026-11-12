import {
  ALL_CATEGORIES,
  expectSearchRequest,
  searchFixtures,
  searchQueries,
} from '../../support/search';
import { Then } from '../../support/steps';

Then('the client shall return matching character results', function () {
  expectSearchRequest(searchQueries.characterName, ALL_CATEGORIES);
  expect(this.result).toEqual(searchFixtures.characters());
});
