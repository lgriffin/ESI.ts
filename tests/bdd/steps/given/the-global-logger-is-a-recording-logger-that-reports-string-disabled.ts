import type { LoggerLevel } from '../../../../src/core/logger/ILogger';
import { recordingLogger, useGlobalLogger } from '../../support/logging';
import { Given } from '../../support/steps';

Given(
  'the global logger is a recording logger that reports {string} disabled',
  function (level: LoggerLevel) {
    const logger = recordingLogger([level]);
    this.values.logger = logger;
    useGlobalLogger(this, logger);
  },
);
