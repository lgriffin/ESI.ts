import { queueTokenAnswer } from '../../support/token-manager';
import { Given } from '../../support/steps';

Given(
  'SSO answers the next code exchange with a token for character {int} with the scopes {string}',
  function (characterId: number, scopes: string) {
    queueTokenAnswer({ characterId, scopes: scopes.split(' ') });
  },
);
