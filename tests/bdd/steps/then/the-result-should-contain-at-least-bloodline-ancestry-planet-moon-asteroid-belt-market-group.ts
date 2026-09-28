import { Then } from '../../support/steps';

// One step for every collection the SDE features count; the noun names the
// records for the reader and the count is what is checked.
Then(
  /^the result should contain at least (\d+) (?:bloodline|ancestry|planet|moon|asteroid belt|market group)$/,
  function (count: string) {
    expect(this.result.length).toBeGreaterThanOrEqual(Number(count));
  },
);
