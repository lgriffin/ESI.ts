import { widerStore } from '../../support/cache-components';
import { Given } from '../../support/steps';

Given('a store implementing every wider cache call', function () {
  this.values.store = widerStore('none');
});
