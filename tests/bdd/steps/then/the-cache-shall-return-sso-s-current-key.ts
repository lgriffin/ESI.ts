import { currentJwk } from '../../support/token-verification';
import { Then } from '../../support/steps';

Then("the cache shall return SSO's current key", function () {
  expect(this.error).toBeUndefined();
  expect(this.result.export({ format: 'jwk' }).n).toBe(currentJwk()['n']);
});
