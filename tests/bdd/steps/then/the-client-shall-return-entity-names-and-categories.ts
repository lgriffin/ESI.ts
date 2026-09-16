import {
  ENTITY_IDS,
  universeFixtures,
  universeMatches,
} from '../../support/universe';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return entity names and categories', function () {
  const request = lastRequest();
  expect(request.method).toBe('POST');
  expect(request.url.pathname).toMatch(universeMatches.names());
  expect(JSON.parse(request.body ?? 'null')).toEqual(ENTITY_IDS);
  expect(this.result).toEqual(universeFixtures.entityNames());
  expect(this.result.map((e: any) => [e.id, e.name, e.category])).toEqual([
    [30000142, 'Jita', 'solar_system'],
    [60003760, 'Jita IV - Moon 4 - Caldari Navy Assembly Plant', 'station'],
    [1689391488, 'Test Character', 'character'],
  ]);
});
