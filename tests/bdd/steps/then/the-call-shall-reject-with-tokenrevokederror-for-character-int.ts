import { TokenRevokedError } from '../../../../src/auth/errors';
import { Then } from '../../support/steps';

Then(
  'the call shall reject with TokenRevokedError for character {int}',
  function (characterId: number) {
    const error = this.error as TokenRevokedError;
    expect(error).toBeInstanceOf(TokenRevokedError);
    expect(error.characterId).toBe(characterId);
  },
);
