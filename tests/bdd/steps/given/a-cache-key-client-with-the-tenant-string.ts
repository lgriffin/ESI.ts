import { keyClient } from '../../support/cache-components';
import { Given } from '../../support/steps';

Given('a cache key client with the tenant {string}', function (tenant: string) {
  const client = keyClient();
  client.setTenant(tenant);
  this.values.keyClient = client;
});
