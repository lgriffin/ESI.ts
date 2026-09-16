import {
  JITA,
  universeFixtures,
  universeMatches,
} from '../../support/universe';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return complete system details', function () {
  const request = lastRequest();
  expect(request.method).toBe('GET');
  expect(request.url.pathname).toMatch(universeMatches.system(JITA));
  expect(this.result).toEqual(universeFixtures.jita());
  expect(this.result.name).toBe('Jita');
  expect(this.result.security_status).toBe(0.9459991455078125);
  expect(this.result.stargates).toEqual([50000001, 50000002]);
  expect(this.result.stations).toEqual([60003760, 60003761]);
  expect(this.result.planets.map((p: any) => p.planet_id)).toEqual([
    40000001, 40000004,
  ]);
});
