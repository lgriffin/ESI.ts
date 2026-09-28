import { JITA, KIMOTORO, type RegionDescent } from '../../support/sde';
import { Then } from '../../support/steps';

Then(
  'the provider shall return Kimotoro constellation and Jita solar system',
  function () {
    const descent: RegionDescent = this.result;
    expect(descent.constellations.length).toBeGreaterThanOrEqual(1);
    expect(descent.constellations[0]!.name).toBe(KIMOTORO);
    expect(descent.systems.length).toBeGreaterThanOrEqual(1);
    expect(descent.systems.find((s) => s.name === JITA.name)).toBeDefined();
  },
);
