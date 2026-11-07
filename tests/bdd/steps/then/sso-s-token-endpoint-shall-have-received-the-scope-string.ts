import { ssoForms } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then(
  "SSO's token endpoint shall have received the scope {string}",
  function (scope: string) {
    const forms = ssoForms('/v2/oauth/token');
    expect(forms.map((f) => f.get('scope'))).toEqual([scope]);
  },
);
