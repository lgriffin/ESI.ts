import { ssoForms } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then(
  "SSO's token endpoint shall have received the code verifier {string} and the redirect URI {string}",
  function (codeVerifier: string, redirectUri: string) {
    const [form] = ssoForms('/v2/oauth/token');
    expect(form?.get('code_verifier')).toBe(codeVerifier);
    expect(form?.get('redirect_uri')).toBe(redirectUri);
  },
);
