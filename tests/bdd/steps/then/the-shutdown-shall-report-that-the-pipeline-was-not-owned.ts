import { Then } from '../../support/steps';

Then('the shutdown shall report that the pipeline was not owned', function () {
  expect(this.result).toBe(false);
});
