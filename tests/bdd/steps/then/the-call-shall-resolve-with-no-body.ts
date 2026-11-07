import { Then } from '../../support/steps';

Then('the call shall resolve with no body', function () {
  expect(this.error).toBeUndefined();
  expect(this.result).toBeUndefined();
});
