import type { LoggerLevel } from '../../../../src/core/logger/ILogger';
import { Then } from '../../support/steps';

Then(
  'the logger shall report {string} enabled and {string} disabled',
  function (enabled: LoggerLevel, disabled: LoggerLevel) {
    const logger = this.values.subjectLogger;
    expect(logger.isLevelEnabled(enabled)).toBe(true);
    expect(logger.isLevelEnabled(disabled)).toBe(false);
  },
);
