import {
  CountingDeduplicator,
  createSeamRuntime,
} from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given(
  'a runtime for the application {string} with a supplied deduplicator',
  function (userAgent: string) {
    const deduplicator = new CountingDeduplicator();
    this.values.deduplicator = deduplicator;
    this.esi = createSeamRuntime({ userAgent, deduplicator });
  },
);
