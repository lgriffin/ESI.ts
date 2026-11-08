import { cacheOf } from '../../support/cache-components';
import { When } from '../../support/steps';

When('the cache invalidates the path {string}', function (path: string) {
  this.result = cacheOf(this).deleteByPath(path);
});
