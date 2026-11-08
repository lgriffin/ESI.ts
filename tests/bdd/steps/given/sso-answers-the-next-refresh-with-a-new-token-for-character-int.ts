import { queueTokenAnswer } from '../../support/token-manager';
import { Given } from '../../support/steps';

Given(
  'SSO answers the next refresh with a new token for character {int}',
  function (characterId: number) {
    queueTokenAnswer({ characterId });
  },
);
