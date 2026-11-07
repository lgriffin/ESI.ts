import { decodeWith, unsignedToken } from '../../support/token-verification';
import { When } from '../../support/steps';

When(
  'an access token for character {int} with a fourth segment is decoded',
  function (characterId: number) {
    const token = unsignedToken({ sub: `CHARACTER:EVE:${characterId}` });
    decodeWith(this, `${token}.extra`);
  },
);
