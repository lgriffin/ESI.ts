import { MemoryTokenStorage } from '../../../../src/auth/storage/MemoryTokenStorage';
import { makeStoredToken } from '../../step-definitions/shared/sso-helpers';
import { When } from '../../support/steps';

When(
  'a memory token storage is built with character {int} holding the scopes {string}',
  function (characterId: number, scopes: string) {
    this.values.memoryStorage = new MemoryTokenStorage([
      makeStoredToken({ characterId, scopes: scopes.split(' ') }),
    ]);
  },
);
