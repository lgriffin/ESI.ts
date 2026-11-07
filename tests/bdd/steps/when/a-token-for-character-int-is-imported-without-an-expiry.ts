import { makeJwt } from '../../step-definitions/shared/sso-helpers';
import { attempt, manager } from '../../support/token-manager';
import { When } from '../../support/steps';

When(
  'a token for character {int} is imported without an expiry',
  async function (characterId: number) {
    const accessToken = makeJwt({ characterId });
    this.values.importedAccessToken = accessToken;
    await attempt(this, () =>
      manager(this).manager.importToken({
        accessToken,
        refreshToken: 'refresh-imported',
      }),
    );
  },
);
