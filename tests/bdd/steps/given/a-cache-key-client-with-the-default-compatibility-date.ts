import { keyClient } from '../../support/cache-components';
import { COMPATIBILITY_DATE } from '../../../../src/core/constants';
import { Given } from '../../support/steps';

Given('a cache key client with the default compatibility date', function () {
  const client = keyClient();
  client.setCompatibilityDate(COMPATIBILITY_DATE);
  this.values.keyClient = client;
});
