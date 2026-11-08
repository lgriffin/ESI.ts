import { Then } from '../../support/steps';

Then('the walk shall resolve with {int} orders', function (count: number) {
  expect(this.error).toBeUndefined();
  expect(this.result).toHaveLength(count);
});
