import { EXPLORATION, universeMatches } from '../../support/universe';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall successfully retrieve all system data', function () {
  const { system, star, station, planet } = this.values;
  const { systemId, starId, stationId, planetId } = EXPLORATION;
  const paths = sentRequests().map((r) => r.url.pathname);
  expect(paths).toHaveLength(4);
  expect(paths[0]).toMatch(universeMatches.system(systemId));
  // The follow-up lookups use the identifiers read from the system record.
  expect(paths.slice(1)).toEqual(
    expect.arrayContaining([
      expect.stringMatching(universeMatches.star(starId)),
      expect.stringMatching(universeMatches.station(stationId)),
      expect.stringMatching(universeMatches.planet(planetId)),
    ]),
  );

  expect(system.system_id).toBe(systemId);
  expect(system.name).toBe('Jita');
  expect(star.solar_system_id).toBe(systemId);
  expect(station.station_id).toBe(stationId);
  expect(station.system_id).toBe(systemId);
  expect(planet.planet_id).toBe(planetId);
  expect(planet.system_id).toBe(systemId);
});
