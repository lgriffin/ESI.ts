import type { LoggerLevel } from '../../../../src/core/logger/ILogger';
import { When } from '../../support/steps';

When(
  'the application logs {string} at level {string}',
  function (message, level: LoggerLevel) {
    this.values.consoleLogger[level](message);
  },
);
