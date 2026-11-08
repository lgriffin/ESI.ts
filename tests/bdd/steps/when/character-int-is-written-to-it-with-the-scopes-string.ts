import { makeStoredToken } from '../../step-definitions/shared/sso-helpers';
import { When } from '../../support/steps';

When(
  'character {int} is written to it with the scopes {string}',
  async function (characterId: number, scopes: string) {
    this.values.writtenScopes = scopes.split(' ');
    await this.values.fileStorage.set(
      characterId,
      makeStoredToken({ characterId, scopes: scopes.split(' ') }),
    );
  },
);
