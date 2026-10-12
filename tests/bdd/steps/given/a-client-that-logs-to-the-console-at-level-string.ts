import { createConsoleLogger } from '../../../../src/core/logger/ConsoleLogger';
import { captureConsole } from '../../support/logging';
import { createSeamClient } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a client that logs to the console at level {string}', function (level) {
  const capture = captureConsole();
  this.cleanups.push(capture.restore);
  this.values.console = capture.lines;
  this.client = createSeamClient({
    logger: createConsoleLogger(level),
    logLevel: 'trace',
  });
});
