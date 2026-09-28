import { Then } from '../../support/steps';

Then('the first group name should be {string}', function (name: string) {
  expect(this.result[0].name).toBe(name);
});
