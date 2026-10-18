import { buildClientsSharingStore } from '../../support/shared-cache-store';
import { Given } from '../../support/steps';

Given(
  'two EsiClients sharing a cache store without the invalidation hooks',
  function () {
    buildClientsSharingStore(this, { invalidationHooks: false });
  },
);
