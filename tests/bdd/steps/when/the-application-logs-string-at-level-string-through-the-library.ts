import type { LoggerLevel } from '../../../../src/core/logger/ILogger';
import { LIBRARY_LOG } from '../../support/logging';
import { When } from '../../support/steps';

When(
  'the application logs {string} at level {string} through the library',
  function (message: string, level: LoggerLevel) {
    LIBRARY_LOG[level](message);
  },
);
