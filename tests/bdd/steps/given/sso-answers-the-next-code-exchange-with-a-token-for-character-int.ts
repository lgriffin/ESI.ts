import { queueTokenAnswer } from '../../support/token-manager';
import { Given } from '../../support/steps';

Given(
  'SSO answers the next code exchange with a token for character {int}',
  function (characterId: number) {
    queueTokenAnswer({ characterId });
  },
);
