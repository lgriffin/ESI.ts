import type { LoggerLevel } from '../../../../src/core/logger/ILogger';
import { LIBRARY_LOG } from '../../support/logging';
import { When } from '../../support/steps';

When(
  'the application logs {string} at level {string} through the library with the context:',
  function (message: string, level: LoggerLevel, context: string) {
    const passed = JSON.parse(context);
    this.values.passedContext = passed;
    LIBRARY_LOG[level](message, passed);
  },
);
