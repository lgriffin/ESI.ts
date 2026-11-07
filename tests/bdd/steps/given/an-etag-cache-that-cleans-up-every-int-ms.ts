import { useEtagCache } from '../../support/cache-components';
import { Given } from '../../support/steps';

Given(
  'an ETag cache that cleans up every {int} ms',
  function (cleanupInterval: number) {
    useEtagCache(this, { cleanupInterval });
  },
);
