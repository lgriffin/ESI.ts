import { cacheOf } from '../../support/cache-components';
import { recordWrite } from '../../../../src/core/cache/writeLog';
import { When } from '../../support/steps';

When('{int} writes to other paths are recorded', function (count: number) {
  const cache = cacheOf(this);
  for (let i = 0; i < count; i += 1)
    recordWrite(cache, `/universe/types/${i}/`);
});
