import { Then } from '../../support/steps';

Then('every error type guard shall return false', function () {
  expect(this.result).toEqual([]);
});
