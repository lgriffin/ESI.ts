import { createSeamRuntime } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given(
  'a runtime for the application {string} with response validation on',
  function (userAgent: string) {
    this.esi = createSeamRuntime({ userAgent, validateResponse: true });
  },
);
