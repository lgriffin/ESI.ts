import { useEtagCache } from '../../support/cache-components';
import { Given } from '../../support/steps';

Given('an ETag cache with the default settings', function () {
  useEtagCache(this);
});
