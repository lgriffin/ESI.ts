import { Then } from '../../support/steps';

Then('the returned record shall be named {string}', function (name: string) {
  expect(this.result).not.toBeNull();
  expect(this.result.name).toBe(name);
});
