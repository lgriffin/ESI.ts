import { cacheOf } from '../../support/cache-components';
import { recordWrite } from '../../../../src/core/cache/writeLog';
import { When } from '../../support/steps';

When('a write to {string} is recorded', function (path: string) {
  recordWrite(cacheOf(this), path);
});
