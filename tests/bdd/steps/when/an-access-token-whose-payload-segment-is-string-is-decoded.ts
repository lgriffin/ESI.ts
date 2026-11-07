import { decodeWith } from '../../support/token-verification';
import { When } from '../../support/steps';

When(
  'an access token whose payload segment is {string} is decoded',
  function (payload: string) {
    const header = Buffer.from('{"alg":"RS256"}').toString('base64url');
    decodeWith(
      this,
      `${header}.${Buffer.from(payload).toString('base64url')}.sig`,
    );
  },
);
