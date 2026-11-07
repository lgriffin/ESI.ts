import { Then } from '../../support/steps';

Then(
  'the cursor walk shall resolve with {int} projects',
  function (count: number) {
    expect(this.error).toBeUndefined();
    expect(this.result).toHaveLength(count);
  },
);
