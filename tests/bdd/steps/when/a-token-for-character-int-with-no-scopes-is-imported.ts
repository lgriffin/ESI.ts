import { makeJwt } from '../../step-definitions/shared/sso-helpers';
import { attempt, jwtWithout, manager } from '../../support/token-manager';
import { When } from '../../support/steps';

When(
  'a token for character {int} with no scopes is imported',
  async function (characterId: number) {
    await attempt(this, () =>
      manager(this).manager.importToken({
        accessToken: jwtWithout(makeJwt({ characterId }), 'scp'),
        refreshToken: 'refresh-imported',
      }),
    );
  },
);
