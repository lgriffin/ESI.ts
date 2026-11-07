import type { LoggerLevel } from '../../../../src/core/logger/ILogger';
import { PINO_LEVEL_VALUES } from '../../support/logging';
import { When } from '../../support/steps';

When("the sink's level changes to {string}", function (level: LoggerLevel) {
  this.values.sink.levelVal = PINO_LEVEL_VALUES[level];
});
