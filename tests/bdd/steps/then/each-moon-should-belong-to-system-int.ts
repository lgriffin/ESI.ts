import { type Moon } from '../../../../src/sde/domain/types';
import { Then } from '../../support/steps';

Then('each moon should belong to system {int}', function (systemId: number) {
  const moons: Moon[] = this.result;
  expect(moons.length).toBeGreaterThanOrEqual(1);
  for (const moon of moons) {
    expect(moon.solarSystemId).toBe(systemId);
  }
});
