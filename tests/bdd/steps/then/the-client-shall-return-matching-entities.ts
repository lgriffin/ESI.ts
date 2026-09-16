import {
  SEARCH_CHARACTER_ID,
  universeFixtures,
  universeMatches,
} from '../../support/universe';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return matching entities', function () {
  const request = lastRequest();
  expect(request.method).toBe('GET');
  expect(request.url.pathname).toMatch(
    universeMatches.characterSearch(SEARCH_CHARACTER_ID),
  );
  expect(request.url.searchParams.get('search')).toBe('Jita');
  expect(request.url.searchParams.get('categories')).toBe(
    'solar_system,station,constellation,region',
  );
  expect(request.headers.authorization).toBe('Bearer bdd-access-token');
  expect(this.result).toEqual(universeFixtures.searchResults());
  expect(this.result.solar_system).toEqual([30000142]);
  expect(this.result.station).toEqual([60003760, 60003761]);
});
