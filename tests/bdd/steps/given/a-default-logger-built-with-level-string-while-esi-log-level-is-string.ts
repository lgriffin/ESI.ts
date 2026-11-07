import { createDefaultLogger } from '../../../../src/core/logger/DefaultLogger';
import { withLogLevelEnv } from '../../support/logging';
import { Given } from '../../support/steps';

Given(
  'a default logger built with level {string} while ESI_LOG_LEVEL is {string}',
  function (level: string, env: string) {
    this.cleanups.push(withLogLevelEnv(env));
    this.values.subjectLogger = createDefaultLogger(level);
  },
);
