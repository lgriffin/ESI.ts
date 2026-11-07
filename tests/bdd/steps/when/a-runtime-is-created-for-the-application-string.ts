import { createSeamRuntime } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  'a runtime is created for the application {string}',
  function (userAgent: string) {
    try {
      this.esi = createSeamRuntime({ userAgent });
    } catch (err: unknown) {
      this.error = err;
    }
  },
);
