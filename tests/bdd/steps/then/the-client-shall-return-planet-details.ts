import {
  JITA_IV_ID,
  universeFixtures,
  universeMatches,
} from '../../support/universe';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return planet details', function () {
  expect(lastRequest().url.pathname).toMatch(
    universeMatches.planet(JITA_IV_ID),
  );
  expect(this.result).toEqual(universeFixtures.jitaIV());
  expect(this.result.name).toBe('Jita IV');
  expect(this.result.system_id).toBe(30000142);
  expect(this.result.position).toEqual({ x: 150000000000, y: 0, z: 0 });
});
