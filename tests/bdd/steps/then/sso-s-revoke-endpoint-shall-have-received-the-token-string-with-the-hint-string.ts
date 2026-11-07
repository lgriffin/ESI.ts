import { ssoForms } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then(
  "SSO's revoke endpoint shall have received the token {string} with the hint {string}",
  function (token: string, hint: string) {
    const forms = ssoForms('/v2/oauth/revoke');
    expect(
      forms.map((f) => [f.get('token'), f.get('token_type_hint')]),
    ).toEqual([[token, hint]]);
  },
);
