import { Then } from '../../support/steps';

// One step for every collection the SDE features count exactly.
Then(
  /^the result should contain exactly (\d+) records?$/,
  function (count: string) {
    expect(this.result).toHaveLength(Number(count));
  },
);
