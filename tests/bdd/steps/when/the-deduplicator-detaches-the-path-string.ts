import { deduplicatorOf } from '../../support/pipeline-parts';
import { When } from '../../support/steps';

When('the deduplicator detaches the path {string}', function (path: string) {
  this.result = deduplicatorOf(this).detachByPath(path);
});
