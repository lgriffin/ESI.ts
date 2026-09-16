import { EXPLORATION } from '../../support/universe';
import { When } from '../../support/steps';

When('the client gathers complete system information', async function () {
  const system = await this.client.universe.getSystemById(EXPLORATION.systemId);
  const [star, station, planet] = await Promise.all([
    this.client.universe.getStarById(system.star_id!),
    this.client.universe.getStationById(system.stations![0]),
    this.client.universe.getPlanetById(system.planets![0].planet_id),
  ]);
  Object.assign(this.values, { system, star, station, planet });
});
