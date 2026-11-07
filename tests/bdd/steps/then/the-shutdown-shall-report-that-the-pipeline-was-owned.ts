import { Then } from '../../support/steps';

Then('the shutdown shall report that the pipeline was owned', function () {
  expect(this.result).toBe(true);
});
