import { recordingLogger, useGlobalLogger } from '../../support/logging';
import { Given } from '../../support/steps';

Given('the global logger is a recording logger', function () {
  const logger = recordingLogger();
  this.values.logger = logger;
  useGlobalLogger(this, logger);
});
