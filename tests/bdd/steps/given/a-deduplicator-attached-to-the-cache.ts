import { storeCacheOf } from '../../support/cache-components';
import { RequestDeduplicator } from '../../../../src/core/RequestDeduplicator';
import { Given } from '../../support/steps';

Given('a deduplicator attached to the cache', function () {
  const deduplicator = new RequestDeduplicator();
  storeCacheOf(this).attachDeduplicator(deduplicator);
  this.values.deduplicator = deduplicator;
  this.values.sentReads = 0;
});
