import { Then } from '../../support/steps';

Then('the call shall resolve with {int}', function (value: number) {
  expect(this.error).toBeUndefined();
  expect(this.result).toBe(value);
});
