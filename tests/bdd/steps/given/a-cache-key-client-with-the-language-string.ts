import { keyClient } from '../../support/cache-components';
import { Given } from '../../support/steps';

Given(
  'a cache key client with the language {string}',
  function (language: string) {
    const client = keyClient();
    client.setLanguage(language);
    this.values.keyClient = client;
  },
);
