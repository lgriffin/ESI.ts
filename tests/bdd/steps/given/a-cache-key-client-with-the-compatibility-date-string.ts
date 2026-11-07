import { keyClient } from '../../support/cache-components';
import { Given } from '../../support/steps';

Given(
  'a cache key client with the compatibility date {string}',
  function (date: string) {
    const client = keyClient();
    client.setCompatibilityDate(date);
    this.values.keyClient = client;
  },
);
