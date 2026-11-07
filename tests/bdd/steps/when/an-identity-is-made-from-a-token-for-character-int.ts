import { identityFromToken } from '../../../../src/core/identity';
import { makeJwt } from '../../step-definitions/shared/sso-helpers';
import { When } from '../../support/steps';

When(
  'an identity is made from a token for character {int}',
  function (characterId: number) {
    this.result = identityFromToken(makeJwt({ characterId }));
  },
);
