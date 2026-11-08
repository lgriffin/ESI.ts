import { keyClient } from '../../support/cache-components';
import { Given } from '../../support/steps';

Given('a cache key client with the host {string}', function (link: string) {
  this.values.keyClient = keyClient(link);
});
