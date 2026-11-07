import { Then } from '../../support/steps';

Then('the call shall resolve', function () {
  expect(this.error).toBeUndefined();
});
