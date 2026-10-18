import { esiClientOf } from '../../support/identity-views';
import { CHARACTER_ID, managedCharacter } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given(
  'an identity view of the EsiClient for a character managed by a token manager',
  async function () {
    const { manager, accessToken } = await managedCharacter(CHARACTER_ID);
    this.values.storedToken = accessToken;
    this.values.view = esiClientOf(this).as(manager.identity(CHARACTER_ID));
  },
);
