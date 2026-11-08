import { Then } from '../../support/steps';

Then('the detach shall report {int} requests', function (count: number) {
  expect(this.result).toBe(count);
});
