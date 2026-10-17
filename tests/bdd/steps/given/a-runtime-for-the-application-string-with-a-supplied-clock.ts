import { createSeamRuntime, ManualClock } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given(
  'a runtime for the application {string} with a supplied clock',
  function (userAgent: string) {
    const clock = new ManualClock();
    this.values.clock = clock;
    this.esi = createSeamRuntime({ userAgent, clock });
  },
);
