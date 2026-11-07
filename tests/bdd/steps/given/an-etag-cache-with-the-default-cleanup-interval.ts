import { useEtagCache } from '../../support/cache-components';
import { Given } from '../../support/steps';

Given('an ETag cache with the default cleanup interval', function () {
  useEtagCache(this, { cleanupInterval: 'default' });
});
