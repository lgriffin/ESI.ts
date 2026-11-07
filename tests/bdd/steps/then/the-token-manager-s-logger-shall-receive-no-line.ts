import { Then } from '../../support/steps';

Then("the token manager's logger shall receive no line", function () {
  expect(this.values.logger.lines).toEqual([]);
});
