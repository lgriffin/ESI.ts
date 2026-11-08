import { ssoForms } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then(
  "SSO's revoke endpoint shall have received the refresh token {string}",
  function (refreshToken: string) {
    const forms = ssoForms('/v2/oauth/revoke');
    expect(forms.map((f) => f.get('token'))).toEqual([refreshToken]);
  },
);
