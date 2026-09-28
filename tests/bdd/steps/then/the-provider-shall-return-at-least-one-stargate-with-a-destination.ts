import { type Stargate } from '../../../../src/sde/domain/types';
import { Then } from '../../support/steps';

Then(
  'the provider shall return at least one stargate with a destination',
  function () {
    const stargates: Stargate[] = this.result;
    expect(stargates.length).toBeGreaterThanOrEqual(1);
    expect(stargates[0]!.destination.solarSystemId).toBeDefined();
    expect(stargates[0]!.destination.stargateId).toBeDefined();
  },
);
