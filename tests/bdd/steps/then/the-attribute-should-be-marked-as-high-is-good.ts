import { Then } from '../../support/steps';

Then('the attribute should be marked as high is good', function () {
  expect(this.result.highIsGood).toBe(true);
});
