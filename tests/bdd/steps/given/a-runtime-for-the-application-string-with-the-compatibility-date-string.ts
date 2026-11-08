import { createSeamRuntime } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given(
  'a runtime for the application {string} with the compatibility date {string}',
  function (userAgent: string, value: string) {
    this.esi = createSeamRuntime({ userAgent, compatibilityDate: value });
  },
);
