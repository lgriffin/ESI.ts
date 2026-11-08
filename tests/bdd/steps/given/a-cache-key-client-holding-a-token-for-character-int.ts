import { keyClient, tokenFor } from '../../support/cache-components';
import { Given } from '../../support/steps';

Given(
  'a cache key client holding a token for character {int}',
  function (characterId: number) {
    const client = keyClient();
    client.setAccessToken(tokenFor(characterId));
    this.values.keyClient = client;
  },
);
