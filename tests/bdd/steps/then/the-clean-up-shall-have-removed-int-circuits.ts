import { Then } from '../../support/steps';

Then(
  'the clean-up shall have removed {int} circuits',
  function (count: number) {
    expect(this.result).toBe(count);
  },
);
