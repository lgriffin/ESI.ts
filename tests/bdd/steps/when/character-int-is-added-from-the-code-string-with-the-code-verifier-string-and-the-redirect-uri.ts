import { attempt, manager } from '../../support/token-manager';
import { When } from '../../support/steps';

When(
  'character {int} is added from the code {string} with the code verifier {string} and the redirect URI {string}',
  async function (
    _characterId: number,
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ) {
    await attempt(this, () =>
      manager(this).manager.addCharacter(code, { codeVerifier, redirectUri }),
    );
  },
);
