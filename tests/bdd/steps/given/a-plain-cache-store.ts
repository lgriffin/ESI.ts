import { MapCacheStore } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given('a plain cache store', function () {
  this.values.store = new MapCacheStore();
});
