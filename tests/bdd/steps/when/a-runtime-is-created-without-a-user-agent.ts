import { createSeamRuntime } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When('a runtime is created without a user agent', function () {
  try {
    createSeamRuntime({ userAgent: undefined as unknown as string });
  } catch (err) {
    this.error = err;
  }
});
