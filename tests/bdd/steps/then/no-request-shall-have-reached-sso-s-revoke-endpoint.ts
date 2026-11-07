import { ssoForms } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then("no request shall have reached SSO's revoke endpoint", function () {
  expect(this.error).toBeUndefined();
  expect(ssoForms('/v2/oauth/revoke')).toEqual([]);
});
