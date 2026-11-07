import { manager } from '../../support/token-manager';
import { When } from '../../support/steps';

When(
  'the application asks for the identity of character {int} twice',
  function (characterId: number) {
    const tokens = manager(this).manager;
    this.result = [tokens.identity(characterId), tokens.identity(characterId)];
  },
);
