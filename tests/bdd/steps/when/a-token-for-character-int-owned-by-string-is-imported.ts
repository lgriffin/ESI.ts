import { makeJwt } from '../../step-definitions/shared/sso-helpers';
import { attempt, manager } from '../../support/token-manager';
import { When } from '../../support/steps';

When(
  'a token for character {int} owned by {string} is imported',
  async function (characterId: number, ownerHash: string) {
    await attempt(this, () =>
      manager(this).manager.importToken({
        accessToken: makeJwt({ characterId, ownerHash }),
        refreshToken: 'refresh-imported',
      }),
    );
  },
);
