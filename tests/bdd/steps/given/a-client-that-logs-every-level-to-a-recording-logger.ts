import { recordingLogger } from '../../support/logging';
import { createSeamClient } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a client that logs every level to a recording logger', function () {
  const logger = recordingLogger();
  this.values.logger = logger;
  this.client = createSeamClient({ logger, logLevel: 'trace' });
});
