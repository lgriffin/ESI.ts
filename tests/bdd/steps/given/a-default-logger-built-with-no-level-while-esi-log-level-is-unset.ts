import { createDefaultLogger } from '../../../../src/core/logger/DefaultLogger';
import { withLogLevelEnv } from '../../support/logging';
import { Given } from '../../support/steps';

Given(
  'a default logger built with no level while ESI_LOG_LEVEL is unset',
  function () {
    this.cleanups.push(withLogLevelEnv(undefined));
    this.values.subjectLogger = createDefaultLogger();
  },
);
