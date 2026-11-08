import { storeEntry } from '../../support/cache-components';
import { Given } from '../../support/steps';

Given('the cache stores {int} numbered items', function (count: number) {
  for (let i = 0; i < count; i += 1) storeEntry(this, `/item/${i}/`, `i${i}`);
});
