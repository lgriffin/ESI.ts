import { Then } from '../../support/steps';

Then('both answers shall be the same view', function () {
  const [first, second] = this.values.views as unknown[];
  expect(first).toBeDefined();
  expect(second).toBe(first);
});
