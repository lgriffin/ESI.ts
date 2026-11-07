import { decodeWith, unsignedToken } from '../../support/token-verification';
import { When } from '../../support/steps';

When(
  'an access token with the subject {string} is decoded',
  function (sub: string) {
    decodeWith(this, unsignedToken({ sub }));
  },
);
