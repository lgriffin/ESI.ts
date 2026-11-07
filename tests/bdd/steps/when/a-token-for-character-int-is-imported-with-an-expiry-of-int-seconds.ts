import { makeJwt } from '../../step-definitions/shared/sso-helpers';
import { attempt, manager } from '../../support/token-manager';
import { When } from '../../support/steps';

When(
  'a token for character {int} is imported with an expiry of {int} seconds',
  async function (characterId: number, expiresIn: number) {
    await attempt(this, () =>
      manager(this).manager.importToken({
        accessToken: makeJwt({ characterId }),
        refreshToken: 'refresh-imported',
        expiresIn,
      }),
    );
  },
);
