import { cacheOf } from '../../support/cache-components';
import { writeGenerationOf } from '../../../../src/core/cache/writeLog';
import { Given } from '../../support/steps';

Given("the cache's write generation is noted", function () {
  this.values.generation = writeGenerationOf(cacheOf(this));
});
