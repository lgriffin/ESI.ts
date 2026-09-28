import { Then } from '../../support/steps';

Then('the result shall be {string}', function (value: string) {
  expect(this.result).toBe(value);
});
