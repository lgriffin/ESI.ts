import { Then } from '../../support/steps';

Then(
  /^the returned record shall belong to system (\d+)$/,
  function (systemId: string) {
    expect(this.result.solarSystemId).toBe(Number(systemId));
  },
);
