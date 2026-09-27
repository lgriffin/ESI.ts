import { addQueryParameter, recordingLogger } from '../../support/logging';
import { createSeamClient } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'a client that logs to a recording logger and sends the query parameter {string} with the value {string}',
  function (name: string, value: string) {
    const logger = recordingLogger();
    this.values.logger = logger;
    this.client = createSeamClient({
      logger,
      requestInterceptors: [addQueryParameter(name, value)],
    });
  },
);
