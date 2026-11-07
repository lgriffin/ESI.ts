import { Then } from '../../support/steps';

Then(
  'the token shall have been refreshed {int} time',
  function (times: number) {
    expect(this.values.refreshes).toBe(times);
  },
);
