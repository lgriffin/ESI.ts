import { buildSurface, type Surface } from '../../support/client-construction';
import { Given } from '../../support/steps';

Given(
  'a client built by {word} for the wallet configured with a token refresh callback answering {string}',
  function (surface: string, token: string) {
    buildSurface(
      this,
      surface as Surface,
      { onTokenRefresh: () => Promise.resolve(token) },
      'wallet',
    );
  },
);
