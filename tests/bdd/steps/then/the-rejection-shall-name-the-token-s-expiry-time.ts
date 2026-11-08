import { Then } from '../../support/steps';

Then("the rejection shall name the token's expiry time", function () {
  expect((this.error as Error).message).toContain(this.values.expiresAt);
});
