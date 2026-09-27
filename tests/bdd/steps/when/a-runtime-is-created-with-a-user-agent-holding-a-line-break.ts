import { createSeamRuntime } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  'a runtime is created with a user agent holding a line break',
  function () {
    try {
      createSeamRuntime({ userAgent: 'fleet-tool\r\nX-Injected: 1' });
    } catch (err) {
      this.error = err;
    }
  },
);
