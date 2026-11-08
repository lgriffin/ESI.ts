import { ssoForms } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then("SSO's token endpoint shall have received no scope field", function () {
  const forms = ssoForms('/v2/oauth/token');
  expect(forms).toHaveLength(1);
  expect(forms[0]?.has('scope')).toBe(false);
});
