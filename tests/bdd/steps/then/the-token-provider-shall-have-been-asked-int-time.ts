import { Then } from '../../support/steps';

Then(
  'the token provider shall have been asked {int} time',
  function (times: number) {
    expect(this.values.providerCalls).toBe(times);
  },
);
