import {
  CITADEL_ID,
  universeFixtures,
  universeMatches,
} from '../../support/universe';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return structure details', function () {
  const request = lastRequest();
  expect(request.url.pathname).toMatch(universeMatches.structure(CITADEL_ID));
  // Structure lookups need a docking-access token.
  expect(request.headers.authorization).toBe('Bearer bdd-access-token');
  expect(this.result).toEqual(universeFixtures.citadel());
  expect(this.result.name).toBe('Test Citadel');
  expect(this.result.solar_system_id).toBe(30000142);
  expect(this.result.position).toEqual({
    x: 1000000000,
    y: 2000000000,
    z: 3000000000,
  });
});
