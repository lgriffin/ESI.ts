import { Then } from '../../support/steps';

Then('the read shall find no entry', function () {
  expect(this.result).toBeNull();
});
