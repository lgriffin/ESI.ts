import { useEtagCache } from '../../support/cache-components';
import { Given } from '../../support/steps';

Given(
  'an ETag cache holding at most {int} entries',
  function (maxEntries: number) {
    useEtagCache(this, { maxEntries });
  },
);
