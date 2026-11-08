import { deduplicatorOf } from '../../support/pipeline-parts';
import { When } from '../../support/steps';

When('the deduplicator is cleared', function () {
  deduplicatorOf(this).clear();
});
