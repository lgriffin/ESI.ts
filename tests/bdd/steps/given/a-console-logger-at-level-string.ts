import { createConsoleLogger } from '../../../../src/core/logger/ConsoleLogger';
import { captureConsole } from '../../support/logging';
import { Given } from '../../support/steps';

Given('a console logger at level {string}', function (level) {
  const capture = captureConsole();
  this.cleanups.push(capture.restore);
  this.values.console = capture.lines;
  this.values.consoleLogger = createConsoleLogger(level);
});
