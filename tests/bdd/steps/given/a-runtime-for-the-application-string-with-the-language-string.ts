import { createSeamRuntime } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given(
  'a runtime for the application {string} with the language {string}',
  function (userAgent: string, value: string) {
    this.esi = createSeamRuntime({ userAgent, language: value });
  },
);
