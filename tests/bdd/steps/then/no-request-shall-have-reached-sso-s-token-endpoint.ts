import { ssoForms } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then("no request shall have reached SSO's token endpoint", function () {
  expect(ssoForms('/v2/oauth/token')).toEqual([]);
});
