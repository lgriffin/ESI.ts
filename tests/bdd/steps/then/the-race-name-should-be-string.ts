import { Then } from '../../support/steps';

Then('the race name should be {string}', function (name: string) {
  expect(this.result).not.toBeNull();
  expect(this.result.name).toBe(name);
});
