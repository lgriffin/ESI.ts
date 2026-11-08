import { identityFromProvider } from '../../../../src/core/identity';
import { When } from '../../support/steps';

When(
  'an identity is made from a token provider for character {int}',
  function (characterId: number) {
    this.result = identityFromProvider(() => Promise.resolve('token'), {
      characterId,
    });
  },
);
