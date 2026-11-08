import { useStoreCache } from '../../support/cache-components';
import { Given } from '../../support/steps';

Given(
  'a cache store adapter over a store that carries invalidations',
  function () {
    useStoreCache(this);
  },
);
