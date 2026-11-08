import { Then } from '../../support/steps';

Then('the retry shall have resolved with {string}', function (value: string) {
  expect(this.error).toBeUndefined();
  expect(this.result).toBe(value);
});
