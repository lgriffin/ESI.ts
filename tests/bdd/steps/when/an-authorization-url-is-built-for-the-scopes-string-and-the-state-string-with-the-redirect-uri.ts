import { theSsoClient } from '../../support/sso-client';
import { When } from '../../support/steps';

When(
  'an authorization URL is built for the scopes {string} and the state {string} with the redirect URI {string}',
  function (scopes: string, state: string, redirectUri: string) {
    this.result = new URL(
      theSsoClient(this).getAuthorizationUrl({
        scopes: scopes.split(' '),
        state,
        redirectUri,
      }),
    );
  },
);
