import { useDeduplicator } from '../../support/pipeline-parts';
import { Given } from '../../support/steps';

Given('a request deduplicator that logs to a recording logger', function () {
  useDeduplicator(this);
});
