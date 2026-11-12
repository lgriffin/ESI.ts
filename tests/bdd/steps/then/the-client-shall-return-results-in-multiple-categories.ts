import {
  ALL_CATEGORIES,
  expectSearchRequest,
  searchFixtures,
  searchQueries,
} from '../../support/search';
import { Then } from '../../support/steps';

Then('the client shall return results in multiple categories', function () {
  expectSearchRequest(searchQueries.broad, ALL_CATEGORIES);
  expect(this.result).toEqual(searchFixtures.broad());
  expect(this.result.solar_system).toEqual([30000142]);
  expect(this.result.station).toEqual([60003760, 60003761]);
  expect(this.result.character).toEqual([555555555]);
  expect(this.result.corporation).toEqual([1344654522]);
  expect(this.result.alliance).toBeUndefined();
});
