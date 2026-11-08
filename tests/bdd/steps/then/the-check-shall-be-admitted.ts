import { Then } from '../../support/steps';

Then('the check shall be admitted', function () {
  expect(this.error).toBeUndefined();
  expect(this.result).toBe('admitted');
});
