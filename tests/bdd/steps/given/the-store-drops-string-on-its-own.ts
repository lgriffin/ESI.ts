import { storeOf } from '../../support/cache-components';
import { Given } from '../../support/steps';

Given('the store drops {string} on its own', function (url: string) {
  storeOf(this).delete(url);
});
