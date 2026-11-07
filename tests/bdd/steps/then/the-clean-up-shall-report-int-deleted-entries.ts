import { Then } from '../../support/steps';

Then(
  'the clean-up shall report {int} deleted entries',
  function (count: number) {
    expect(this.result).toBe(count);
  },
);
