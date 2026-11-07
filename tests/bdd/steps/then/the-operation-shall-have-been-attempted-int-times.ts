import { Then } from '../../support/steps';

Then(
  'the operation shall have been attempted {int} times',
  function (times: number) {
    expect(this.values.attempts).toBe(times);
  },
);
