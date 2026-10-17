import { CountingDeduplicator } from '../../support/shared-runtime';
import { createSeamClient } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a client with a supplied deduplicator', function () {
  const deduplicator = new CountingDeduplicator();
  this.values.deduplicator = deduplicator;
  this.client = createSeamClient({ deduplicator });
});
