import { createConsoleLogger } from '../../../../src/core/logger/ConsoleLogger';
import { captureConsole, withLogLevelEnv } from '../../support/logging';
import { Given } from '../../support/steps';

Given(
  'a console logger built with no level while ESI_LOG_LEVEL is {string}',
  function (value) {
    this.cleanups.push(withLogLevelEnv(value));
    const capture = captureConsole();
    this.cleanups.push(capture.restore);
    this.values.console = capture.lines;
    this.values.consoleLogger = createConsoleLogger();
  },
);
