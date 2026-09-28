import { type Planet } from '../../../../src/sde/types';
import { Then } from '../../support/steps';

Then('each planet should belong to system {int}', function (systemId: number) {
  const planets: Planet[] = this.result;
  expect(planets.length).toBeGreaterThanOrEqual(1);
  for (const planet of planets) {
    expect(planet.solarSystemId).toBe(systemId);
  }
});
