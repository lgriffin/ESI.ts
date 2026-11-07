import { decodeWith, unsignedToken } from '../../support/token-verification';
import { When } from '../../support/steps';

When(
  'an access token with these claims is decoded:',
  function (claims: string) {
    decodeWith(this, unsignedToken(JSON.parse(claims)));
  },
);
