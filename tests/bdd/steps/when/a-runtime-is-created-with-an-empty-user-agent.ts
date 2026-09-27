import { createSeamRuntime } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When('a runtime is created with an empty user agent', function () {
  try {
    createSeamRuntime({ userAgent: '' });
  } catch (err) {
    this.error = err;
  }
});
