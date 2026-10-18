import { buildClientsSharingStore } from '../../support/shared-cache-store';
import { Given } from '../../support/steps';

Given(
  'two EsiClients sharing a cache store that carries invalidations',
  function () {
    buildClientsSharingStore(this, { invalidationHooks: true });
  },
);
