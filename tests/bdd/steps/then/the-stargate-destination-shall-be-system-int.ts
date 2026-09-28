import { Then } from '../../support/steps';

Then(
  'the stargate destination shall be system {int}',
  function (systemId: number) {
    expect(this.result.destination.solarSystemId).toBe(systemId);
  },
);
