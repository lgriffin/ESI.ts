import { useLogger } from '../../support/pipeline-parts';
import { createSeamClient } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an EsiClient that logs to a recording logger', function () {
  const logger = useLogger(this);
  this.client = createSeamClient({ logger });
  this.values.failures = new Map<string, unknown>();
});
