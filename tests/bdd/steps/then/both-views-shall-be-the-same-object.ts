import { Then } from '../../support/steps';

Then('both views shall be the same object', function () {
  const [first, second] = this.result;
  expect(first).toBeDefined();
  expect(second).toBe(first);
});
