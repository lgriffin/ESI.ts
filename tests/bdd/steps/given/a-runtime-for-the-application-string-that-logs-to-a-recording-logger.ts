import { recordingLogger } from '../../support/logging';
import { createSeamRuntime } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given(
  'a runtime for the application {string} that logs to a recording logger',
  function (userAgent: string) {
    const logger = recordingLogger();
    this.values.logger = logger;
    this.esi = createSeamRuntime({ userAgent, logger });
  },
);
