import type { LoggerLevel } from '../../../../src/core/logger/ILogger';
import { Then } from '../../support/steps';

const LEVELS: LoggerLevel[] = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
];

Then('the logger shall report every level disabled', function () {
  const logger = this.values.subjectLogger;
  expect(LEVELS.map((level) => logger.isLevelEnabled(level))).toEqual(
    LEVELS.map(() => false),
  );
});
