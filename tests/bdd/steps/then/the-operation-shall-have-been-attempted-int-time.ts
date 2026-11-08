import { Then } from '../../support/steps';

Then(
  'the operation shall have been attempted {int} time',
  function (times: number) {
    expect(this.values.attempts).toBe(times);
  },
);
