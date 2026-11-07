import type { EsiOptions } from '../../../../src/client';
import { createSeamRuntime } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given(
  'a runtime for the application {string} with the datasource {string}',
  function (userAgent: string, value: string) {
    this.esi = createSeamRuntime({
      userAgent,
      datasource: value as EsiOptions['datasource'],
    });
  },
);
