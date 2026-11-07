import { Then } from '../../support/steps';

Then(
  'the token shall have been refreshed {int} times',
  function (times: number) {
    expect(this.values.refreshes).toBe(times);
  },
);
