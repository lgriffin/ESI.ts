import { Then } from '../../support/steps';

Then(
  'the invalidation shall report {int} deleted entries',
  function (count: number) {
    expect(this.result).toBe(count);
  },
);
